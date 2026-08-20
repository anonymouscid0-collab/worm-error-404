import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES V3
// ============================================
const wormApiRoutes = require('./routes/wormApi.routes');
app.use('/', wormApiRoutes);

// ============================================
// BOT TELEGRAM V3
// ============================================
let telegramBot: any = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    const WormTelegramBotV3 = require('./services/telegramBotV3');
    telegramBot = new WormTelegramBotV3(process.env.TELEGRAM_BOT_TOKEN);
    telegramBot.start();
    console.log('🤖 Bot Telegram v3 initialisé');
  } catch (err: any) {
    console.log('⚠️ Bot Telegram non démarré:', err.message);
  }
}

// ============================================
// ROUTES SYSTÈME
// ============================================
app.get('/', (req, res) => {
  res.json({
    name: 'Worm Error 404',
    version: '3.0.0',
    status: 'online',
    description: 'IA Full-Stack Autonome v3 - Cerveau propriétaire + Recherche temps réel',
    brain: 'Worm Brain v3.0 - Deep Reasoning + Multi-Source Search',
    telegram: telegramBot ? 'connected' : 'not configured',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        generateKey: 'POST /auth/keys',
        listKeys: 'GET /auth/keys'
      },
      ai: {
        chat: 'POST /v1/chat/completions (API Key requis)',
        analyzeCode: 'POST /v1/code/analyze (API Key requis)',
        fixCode: 'POST /v1/code/fix (API Key requis)',
        search: 'POST /v1/search (API Key requis)',
        models: 'GET /v1/models (API Key requis)',
        stats: 'GET /v1/stats (API Key requis)'
      },
      system: {
        health: 'GET /health',
        brainStats: 'GET /brain/stats'
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Worm Error 404',
    version: '3.0.0',
    brain: 'worm-fullstack-v3',
    telegram: telegramBot ? 'online' : 'offline',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/brain/stats', (req, res) => {
  const wormBrain = require('./services/wormBrainV3');
  res.json(wormBrain.getStats());
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('ERROR:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============================================
// DÉMARRAGE
// ============================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🐛 W O R M   E R R O R   4 0 4   v3.0                      ║
║  IA Full-Stack Autonome - Brain v3.0                        ║
║  Recherche temps réel + Sécurité                            ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                              ║
║  Health: http://localhost:${PORT}/health                     ║
║  Telegram: ${telegramBot ? 'online' : 'Non configuré'}       ║
╚══════════════════════════════════════════════════════════════╝

📋 ENDPOINTS:
  POST /v1/chat/completions  → Chat IA
  POST /v1/code/analyze      → Analyser code
  POST /v1/code/fix          → Corriger code
  POST /v1/search            → Recherche universelle
  GET  /v1/models            → Liste modèles
  GET  /v1/stats             → Stats clé API
  GET  /health               → Health check
`);
});

export default app;
