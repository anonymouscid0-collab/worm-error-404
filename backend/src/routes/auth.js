const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'worm-secret-key-change-me-prod';

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

// POST /api/auth/register — simple, direct, pas de code email
router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' });

    const existing = db.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const userId = 'user_' + Date.now();

    db.saveUser({
      id: userId,
      email,
      name: name || email.split('@')[0],
      password: hash,
      isVerified: 1,
      plan: 'FREE',
      messagesUsed: 0,
      freeLimit: 15,
      role: 'USER'
    });

    const token = jwt.sign({ id: userId, email, plan: 'FREE' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      accessToken: token,
      user: {
        id: userId,
        email,
        name: name || email.split('@')[0],
        plan: 'FREE',
        messagesUsed: 0,
        freeLimit: 15,
        role: 'USER'
      }
    });
  } catch (err) {
    console.error('Register error:', err);
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

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan || 'FREE',
        messagesUsed: user.messagesUsed || 0,
        freeLimit: user.freeLimit || 15,
        role: user.role || 'USER'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'USER',
    plan: user.plan || 'FREE',
    messagesUsed: user.messagesUsed || 0,
    freeLimit: user.freeLimit || 15
  });
});

module.exports = router;
