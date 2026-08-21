const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'worm-secret-key-change-me-prod';

// ============================================
// ADMIN AUTO AU DÉMARRAGE
// ============================================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function setupAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('⚠️ ADMIN_EMAIL ou ADMIN_PASSWORD non définis');
    return;
  }

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  // Supprimer tous les anciens admins
  try {
    const users = db.getAllUsers ? db.getAllUsers() : [];
    console.log('👥 Users trouvés au démarrage:', users.length);
    users.forEach(u => {
      console.log('  -', u.email, '| role:', u.role, '| id:', u.id);
      if (u.role === 'ADMIN') {
        const deleted = db.deleteUser(u.id);
        console.log('🗑️ Admin supprimé:', u.email, '| success:', deleted);
      }
    });
  } catch (e) {
    console.log('⚠️ Erreur suppression admins:', e.message);
  }

  // Créer le nouvel admin
  try {
    db.saveUser({
      id: 'admin_' + Date.now(),
      email: ADMIN_EMAIL,
      name: 'Admin Worm',
      password: hash,
      isVerified: 1,
      plan: 'PRO',
      messagesUsed: 0,
      freeLimit: 999999,
      role: 'ADMIN'
    });
    console.log('👑 Admin créé:', ADMIN_EMAIL);
  } catch (e) {
    console.log('❌ Erreur création admin:', e.message);
  }
}

// Exécuter au chargement du module
setupAdmin();

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

// ============================================
// ROUTE DE SECOURS : créer admin manuellement
// ============================================
router.post('/api/admin/setup', (req, res) => {
  const { secret, email, password } = req.body;
  if (secret !== 'worm-setup-2026') {
    return res.status(403).json({ error: 'Secret incorrect' });
  }
  
  const hash = bcrypt.hashSync(password, 10);
  db.saveUser({
    id: 'admin_' + Date.now(),
    email,
    name: 'Admin Worm',
    password: hash,
    isVerified: 1,
    plan: 'PRO',
    messagesUsed: 0,
    freeLimit: 999999,
    role: 'ADMIN'
  });
  res.json({ message: 'Admin créé', email });
});

// POST /api/auth/register
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

    const token = jwt.sign({ id: userId, email, plan: 'FREE', role: 'USER' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      accessToken: token,
      user: { id: userId, email, name: name || email.split('@')[0], plan: 'FREE', messagesUsed: 0, freeLimit: 15, role: 'USER' }
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
    if (!user) {
      console.log('❌ Login failed: user not found', email);
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('❌ Login failed: wrong password', email);
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
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
    console.error('Login error:', err);
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
