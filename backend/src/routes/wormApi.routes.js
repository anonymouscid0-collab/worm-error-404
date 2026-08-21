const express = require('express');
const wormBrain = require('../services/wormBrainV3');
const db = require('../services/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'worm-secret-key-change-me-prod';

// Middleware: vérifie clé API OU token JWT
async function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;
  
  // Essayer clé API
  if (apiKey) {
    const keyRecord = db.getKey ? db.getKey(apiKey) : null;
    if (keyRecord) {
      if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
        return res.status(403).json({ error: 'Clé API expirée' });
      }
      req.apiKeyId = keyRecord.id || 1;
      req.userId = keyRecord.userId || 'user';
      req.keyTier = keyRecord.plan || 'pro';
      return next();
    }
  }
  
  // Essayer token JWT
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
      req.keyTier = decoded.plan || 'pro';
      req.apiKeyId = decoded.id;
      return next();
    } catch {
      return res.status(401).json({ error: 'Token invalide' });
    }
  }
  
  return res.status(401).json({ error: 'Clé API ou token requis' });
}

// POST /v1/chat/completions
router.post('/v1/chat/completions', authenticate, async (req, res) => {
  const { messages, model = 'worm-fullstack-v3' } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages est requis (array)' });
  }
  const lastMessage = messages[messages.length - 1].content;
  try {
    const result = await wormBrain.generateResponse(lastMessage, {
      sessionId: req.apiKeyId?.toString(),
      model,
      context: messages.slice(0, -1)
    });
    res.json({
      id: 'worm-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.metadata.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: result.response },
        finish_reason: 'stop'
      }],
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/code/analyze
router.post('/v1/code/analyze', authenticate, async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'code est requis' });
  try {
    const result = await wormBrain.generateResponse(`Analyse ce code:\n\`\`\`${language || ''}\n${code}\n\`\`\``, {
      sessionId: req.apiKeyId?.toString()
    });
    res.json({ analysis: result.response, metadata: result.metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/code/fix
router.post('/v1/code/fix', authenticate, async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'code est requis' });
  try {
    const result = await wormBrain.generateResponse(`Corrige ce code:\n\`\`\`${language || ''}\n${code}\n\`\`\``, {
      sessionId: req.apiKeyId?.toString()
    });
    res.json({ fixed: result.response, metadata: result.metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/search
router.post('/v1/search', authenticate, async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query est requis' });
  try {
    const result = await wormBrain.generateResponse(`Recherche: ${query}`, {
      sessionId: req.apiKeyId?.toString()
    });
    res.json({ results: result.response, metadata: result.metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/models
router.get('/v1/models', authenticate, (req, res) => {
  res.json({
    object: 'list',
    data: [
      { id: 'worm-basic', object: 'model', owned_by: 'worm-error-404' },
      { id: 'worm-fullstack-v3', object: 'model', owned_by: 'worm-error-404' },
      { id: 'worm-research', object: 'model', owned_by: 'worm-error-404' },
      { id: 'worm-security', object: 'model', owned_by: 'worm-error-404' }
    ]
  });
});

// GET /v1/stats
router.get('/v1/stats', authenticate, async (req, res) => {
  res.json({
    api_key_id: req.apiKeyId,
    tier: req.keyTier,
    status: 'active',
    brain_stats: wormBrain.getStats()
  });
});

module.exports = router;
