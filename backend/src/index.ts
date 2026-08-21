import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// LOGGING DEBUG — voir TOUTES les requêtes
// ============================================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('  Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ============================================
// ROUTES
// ============================================
const wormApiRoutes = require('./routes/wormApi.routes');
app.use('/', wormApiRoutes);

const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

const { router: chatRoutes } = require('./routes/chat');
app.use('/', chatRoutes);

const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);

// ============================================
// SOCKET.IO
// ============================================
const setupChatSocket = require('./socket/chat');
setupChatSocket(io);

// ============================================
// BOT TELEGRAM
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
    telegram: telegramBot ? 'connected' : 'not configured',
    features: ['auth', 'admin-panel', 'chat', 'ai-v3', 'telegram-bot']
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

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('ERROR:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

httpServer.listen(PORT, () => {
  console.log(`🐛 WORM ERROR 404 v3.0 PRO en ligne sur le port ${PORT}`);
});

export default app;
