require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialisation BDD
require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

// Bot Telegram v3
let telegramBot = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    const WormTelegramBotV3 = require('./services/telegramBotV3');
    telegramBot = new WormTelegramBotV3(process.env.TELEGRAM_BOT_TOKEN);
    telegramBot.start();
    console.log('🤖 Bot Telegram v3 initialise');
  } catch (err) {
    console.log('⚠️ Bot Telegram non demarre:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path} | ${req.ip}`);
  next();
});

// ============================================
// ROUTES
// ============================================
app.use('/auth', authRoutes);
app.use('/', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/', paymentRoutes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    name: 'Worm Error 404',
    version: '3.0.0',
    status: 'online',
    description: 'IA Full-Stack Autonome v3 - Cerveau proprietaire + Recherche temps reel + Securite offensive/defensive',
    brain: 'Worm Brain v3.0 - Deep Reasoning + Multi-Source Search + Security Engine',
    telegram: telegramBot ? 'connected (@wormerror_bot)' : 'not configured',
    payment: {
      enabled: true,
      methods: ['telegram_stars', 'stripe', 'crypto'],
      plans_endpoint: '/v1/payment/plans',
      checkout_endpoint: '/v1/payment/checkout'
    },
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        generateKey: 'POST /auth/keys (auth requis)',
        listKeys: 'GET /auth/keys (auth requis)'
      },
      ai: {
        chat: 'POST /v1/chat/completions (API Key requis)',
        analyzeCode: 'POST /v1/code/analyze (API Key requis)',
        fixCode: 'POST /v1/code/fix (API Key requis)',
        search: 'POST /v1/search (API Key requis)',
        models: 'GET /v1/models (API Key requis)',
        stats: 'GET /v1/stats (API Key requis)'
      },
      payment: {
        plans: 'GET /v1/payment/plans',
        checkout: 'POST /v1/payment/checkout (auth requis)',
        simulate: 'POST /v1/payment/simulate',
        subscription: 'GET /v1/payment/subscription (auth requis)',
        history: 'GET /v1/payment/history (auth requis)',
        renew: 'POST /v1/payment/renew (auth requis)'
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Worm Error 404',
    version: '3.0.0',
    brain: 'worm-fullstack-v3',
    telegram: telegramBot ? 'online' : 'offline',
    payment: 'enabled',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============================================
// DEMARRAGE
// ============================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🐛  W O R M   E R R O R   4 0 4  v3.0           ║
║                                                              ║
║         IA Full-Stack Autonome - Brain v3.0                 ║
║         Paiement Stars + Recherche temps reel              ║
║         Securite offensive/defensive + OSINT                 ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT.toString().padEnd(50)} ║
║  URL:      http://localhost:${PORT.toString().padEnd(43)} ║
║  Health:   http://localhost:${PORT}/health${''.padEnd(32)} ║
║  Telegram: ${(telegramBot ? 't.me/wormerror_bot' : 'Non configure').padEnd(50)} ║
╚══════════════════════════════════════════════════════════════╝

📋 ENDPOINTS DISPONIBLES:

🔐 AUTHENTIFICATION:
   POST /auth/register        → Creer un compte
   POST /auth/login           → Se connecter  
   POST /auth/keys            → Generer une cle API (auth)
   GET  /auth/keys            → Lister tes cles (auth)

🤖 IA - CERVEAU WORM ERROR 404 v3.0:
   POST /v1/chat/completions  → Chat avec l'IA (ZIP, code, recherche)
   POST /v1/code/analyze      → Analyser du code
   POST /v1/code/fix          → Corriger du code
   POST /v1/search            → Recherche universelle
   GET  /v1/models            → Liste des modeles
   GET  /v1/stats             → Stats de ta cle

💳 PAIEMENT & ABONNEMENTS:
   GET  /v1/payment/plans           → Voir les plans et prix
   POST /v1/payment/checkout        → Creer une session de paiement
   POST /v1/payment/simulate        → Simuler un paiement (test)
   GET  /v1/payment/subscription    → Mon abonnement actif
   GET  /v1/payment/history         → Historique des paiements
   POST /v1/payment/renew           → Renouveler l'abonnement

⚡ CERVEAU: Deep Reasoning + Multi-Source Search + Security Engine
   Aucune dependance OpenAI/Claude. C'est TON IA.
   Recherche: Google, GitHub, StackOverflow, NPM, YouTube, Reddit, Telegram, Dark Web
   Telegram Bot: @wormerror_bot avec paiement Stars
  `);
});

module.exports = app;
