const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'worm-secret-key-change-me-prod';
const conversations = new Map();

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

router.get('/api/chat/conversations', authMiddleware, (req, res) => {
  const userConvs = [];
  for (const [id, conv] of conversations) {
    if (conv.userId === req.user.id) {
      userConvs.push({ id, title: conv.title || 'Nouvelle conversation' });
    }
  }
  res.json({ conversations: userConvs });
});

router.get('/api/chat/conversations/:id', authMiddleware, (req, res) => {
  const conv = conversations.get(req.params.id);
  if (!conv || conv.userId !== req.user.id) return res.status(404).json({ error: 'Conversation non trouvée' });
  res.json({ conversation: conv });
});

router.post('/api/chat/conversations', authMiddleware, (req, res) => {
  const id = 'conv_' + Date.now();
  conversations.set(id, { id, userId: req.user.id, title: 'Nouvelle conversation', messages: [] });
  res.json({ conversationId: id });
});

module.exports = { router, conversations };
