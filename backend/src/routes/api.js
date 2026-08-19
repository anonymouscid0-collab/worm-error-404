/**
 * 🤖 Routes API - Cerveau Worm Error 404 v3
 */
const express = require('express');
const wormBrain = require('../services/wormBrainV3');
const db = require('../config/database');
const bcrypt = require('bcrypt');

const router = express.Router();

// Middleware: vérifie la clé API de façon sécurisée
async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Clé API manquante. Format: Bearer sk-worm-...' });
  }

  const apiKey = authHeader.split(' ')[1];
  
  try {
    // Récupérer toutes les clés actives
    const activeKeys = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM api_keys WHERE is_active = 1', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    if (activeKeys.length === 0) {
      return res.status(401).json({ error: 'Clé API invalide ou inactive' });
    }

    // Trouver la clé correspondant au hash
    let matchedKey = null;
    for (const keyRecord of activeKeys) {
      const isMatch = await bcrypt.compare(apiKey, keyRecord.key_hash);
      if (isMatch) {
        matchedKey = keyRecord;
        break;
      }
    }

    if (!matchedKey) {
      return res.status(401).json({ error: 'Clé API invalide' });
    }

    // Vérifier l'expiration
    if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Clé API expirée. Renouvelle ton abonnement.' });
    }

    req.apiKeyId = matchedKey.id;
    req.userId = matchedKey.user_id;
    req.keyTier = matchedKey.tier;
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

    // Log la requête
    db.run(
      'INSERT INTO request_logs (api_key_id, user_id, endpoint, model_used, latency_ms, status_code) VALUES (?, ?, ?, ?, ?, ?)',
      [req.apiKeyId, req.userId, '/v1/chat/completions', model, result.metadata.latency_ms, 200]
    );

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

  try {
    const result = await wormBrain.generateResponse(`Analyse ce code:\n\`\`\`${language || ''}\n${code}\n\`\`\``, {
      sessionId: req.apiKeyId.toString()
    });
    res.json({ analysis: result.response, metadata: result.metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/code/fix
router.post('/v1/code/fix', authenticateApiKey, async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'code est requis' });

  try {
    const result = await wormBrain.generateResponse(`Corrige ce code:\n\`\`\`${language || ''}\n${code}\n\`\`\``, {
      sessionId: req.apiKeyId.toString()
    });
    res.json({ fixed: result.response, metadata: result.metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/search
router.post('/v1/search', authenticateApiKey, async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query est requis' });

  try {
    const result = await wormBrain.generateResponse(`Recherche: ${query}`, {
      sessionId: req.apiKeyId.toString()
    });
    res.json({ results: result.response, metadata: result.metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// GET /v1/stats
router.get('/v1/stats', authenticateApiKey, async (req, res) => {
  try {
    const logs = await new Promise((resolve, reject) => {
      db.all(
        'SELECT COUNT(*) as total, AVG(latency_ms) as avg_latency FROM request_logs WHERE api_key_id = ?',
        [req.apiKeyId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0] || { total: 0, avg_latency: 0 });
        }
      );
    });

    res.json({
      api_key_id: req.apiKeyId,
      tier: req.keyTier,
      total_requests: logs.total || 0,
      avg_latency_ms: Math.round(logs.avg_latency || 0),
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
