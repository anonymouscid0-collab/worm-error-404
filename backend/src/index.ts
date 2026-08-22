import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';

import { env } from './config/env';
import apiRoutes from './routes';
import { setupChatSocket } from './socket/chatSocket';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.frontendUrl, methods: ['GET', 'POST'], credentials: true }
});

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes. Réessayez plus tard.' }
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/', apiRoutes);
setupChatSocket(io);

let telegramBot: any = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    const WormTelegramBotV3 = require('./services/telegramBotV3');
    telegramBot = new WormTelegramBotV3(process.env.TELEGRAM_BOT_TOKEN);
    telegramBot.start().catch((err: any) => {
      console.log('⚠️ Bot Telegram non démarré:', err.message);
    });
    console.log('🤖 Bot Telegram v3 initialisé');
  } catch (err: any) {
    console.log('⚠️ Bot Telegram non démarré:', err.message);
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'WORM ERROR 404',
    version: '3.1.0',
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

const PORT = env.port;
httpServer.listen(PORT, () => {
  console.log(`🐛 WORM ERROR 404 v3.1 PRO en ligne sur le port ${PORT}`);
});

export default app;
