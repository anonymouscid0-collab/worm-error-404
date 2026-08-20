const express = require('express');
const db = require('../services/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'worm-secret-key-change-me-prod';

// Middleware : vérifie si admin
function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Admin uniquement.' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// GET /api/admin/users — liste tous les users
router.get('/api/admin/users', adminMiddleware, (req, res) => {
  const users = db.getAllUsers ? db.getAllUsers() : [];
  res.json({ users });
});

// DELETE /api/admin/users/:id — supprimer un user
router.delete('/api/admin/users/:id', adminMiddleware, (req, res) => {
  const success = db.deleteUser ? db.deleteUser(req.params.id) : false;
  if (!success) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ message: 'Utilisateur supprimé', id: req.params.id });
});

// GET /api/admin/stats — stats globales
router.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const users = db.getAllUsers ? db.getAllUsers() : [];
  const keys = db.getAllKeys ? db.getAllKeys() : [];
  res.json({
    totalUsers: users.length,
    totalApiKeys: keys.length,
    admin: req.user.email,
    serverUptime: process.uptime()
  });
});

// POST /api/admin/make-pro — upgrade un user en PRO
router.post('/api/admin/make-pro', adminMiddleware, (req, res) => {
  const { userId } = req.body;
  db.updateUser(userId, { plan: 'PRO', freeLimit: 999999 });
  res.json({ message: 'User upgradé en PRO', userId });
});

module.exports = router;
