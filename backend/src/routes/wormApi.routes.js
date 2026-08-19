/**
 * 🤖 Routes API - Cerveau Worm Error 404 v3
 */
const express = require('express');
const wormBrain = require('../services/wormBrainV3');
const db = require('../services/db');
const router = express.Router();

// Middleware: vérifie la clé API dans les headers (x-api-key ou Bearer)
async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];
  const apiKey = apiKeyHeader || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!apiKey) {
    return res.status(401).json({ error: 'Clé API manquante. Format: Header x-api-key ou Bearer sk-worm-...' });
  }

  try {
    const keyRecord = db.getKey ? db.getKey(apiKey) : null;

    if (!keyRecord) {
      return res.status(401).json({ error: 'Clé API invalide ou inexistante' });
    }

    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Clé API expirée. Renouvelle ton abonnement.' });
    }

    req.apiKeyId = keyRecord.id || 1;
    req.userId = keyRecord.owner || 'user';
    req.keyTier = keyRecord.plan || 'pro';
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /v1/chat/completions
router.post('/v1/chat/completions', authenticateApiKey, async (req, res) => {
  const { messages, model = 'worm-fullstack-v3' } = req.body;
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages est requis (array)' });
  }

  const lastMessage = messages[messages.length - 1].content;

  try {
    const result = await wormBrain.generateResponse(lastMessage, {
      sessionId: req.apiKeyId.toString(),
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
router.post('/v1/code/analyze', authenticateApiKey, async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'code est requis' });

  const result = await wormBrain.generateResponse(`Analyse ce code:\n\`\`\`${language || ''}\n${code}\n\`\`\``, {
    sessionId: req.apiKeyId.toString()
  });

  res.json({ analysis: result.response, metadata: result.metadata });
});

// POST /v1/code/fix
router.post('/v1/code/fix', authenticateApiKey, async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'code est requis' });

  const result = await wormBrain.generateResponse(`Corrige ce code:\n\`\`\`${language || ''}\n${code}\n\`\`\``, {
    sessionId: req.apiKeyId.toString()
  });

  res.json({ fixed: result.response, metadata: result.metadata });
});

// GET /v1/models
router.get('/v1/models', authenticateApiKey, (req, res) => {
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

module.exports = router;
