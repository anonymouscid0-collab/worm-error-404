const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../services/db');
const { sendVerificationCode, sendWelcome } = require('../services/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'worm-secret-key-change-me-prod';

// Générer code à 6 chiffres
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Middleware auth
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// ========== EMAIL + PASSWORD ==========

// POST /api/auth/register — envoie code de vérification
router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' });

    const existing = db.getUserByEmail(email);
    if (existing?.isVerified) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const userId = 'user_' + Date.now();

    // Sauvegarder user non-vérifié
    db.saveUser({ id: userId, email, name: name || email.split('@')[0], password: hash, isVerified: 0 });

    // Envoyer code de vérification
    const code = generateCode();
    db.saveCode(email, code);
    await sendVerificationCode(email, code);

    res.json({ message: 'Code de vérification envoyé par email', userId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify — vérifier le code
router.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = db.getCode(email);
    if (!record) return res.status(400).json({ error: 'Aucun code trouvé' });
    if (record.code !== code) return res.status(400).json({ error: 'Code incorrect' });
    if (new Date(record.expiresAt) < new Date()) return res.status(400).json({ error: 'Code expiré' });

    // Vérifier l'user
    const user = db.getUserByEmail(email);
    db.updateUser(user.id, { isVerified: 1 });
    db.deleteCode(email);

    // Envoyer welcome email
    await sendWelcome(email, user.name);

    // Générer token
    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ accessToken: token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, messagesUsed: user.messagesUsed, freeLimit: user.freeLimit, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/resend — renvoyer le code
router.post('/api/auth/resend', async (req, res) => {
  try {
    const { email } = req.body;
    const code = generateCode();
    db.saveCode(email, code);
    await sendVerificationCode(email, code);
    res.json({ message: 'Nouveau code envoyé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const user = db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });
    if (!user.isVerified) return res.status(403). { error: 'Email non vérifié. Vérifie tes emails.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ accessToken: token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, messagesUsed: user.messagesUsed, freeLimit: user.freeLimit, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role || 'USER', plan: user.plan || 'FREE', messagesUsed: user.messagesUsed || 0, freeLimit: user.freeLimit || 15 });
});

// ========== GOOGLE OAUTH ==========

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = db.getUserByGoogleId(profile.id);
    if (!user) {
      const email = profile.emails[0].value;
      const existing = db.getUserByEmail(email);
      if (existing) {
        db.updateUser(existing.id, { googleId: profile.id, avatar: profile.photos[0]?.value });
        user = db.getUserById(existing.id);
      } else {
        const userId = 'user_g_' + Date.now();
        db.saveUser({
          id: userId,
          email,
          name: profile.displayName || email.split('@')[0],
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          isVerified: 1,
          plan: 'FREE'
        });
        user = db.getUserById(userId);
      }
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, db.getUserById(id)));

router.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  const token = jwt.sign({ id: req.user.id, email: req.user.email, plan: req.user.plan }, JWT_SECRET, { expiresIn: '7d' });
  res.redirect(`${process.env.FRONTEND_URL || 'https://worm-error-404-1.onrender.com'}/chat?token=${token}`);
});

module.exports = router;
