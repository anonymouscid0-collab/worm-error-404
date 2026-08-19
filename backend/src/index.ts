import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

const WormTelegramBotV3 = require('./services/telegramBotV3');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialisation du Bot Telegram
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    const telegramBot = new WormTelegramBotV3(process.env.TELEGRAM_BOT_TOKEN);
    telegramBot.start();
    console.log('🤖 Bot Telegram v3 initialise et ecoute les messages!');
  } catch (err: any) {
    console.error('⚠️ Erreur lors du demarrage du bot Telegram:', err.message);
  }
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN non defini dans le fichier .env');
}

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'WORM ERROR 404 API Running'
  });
});

app.listen(PORT, () => {
  console.log(`⚡ WORM ERROR 404 API en ligne sur le port ${PORT}`);
});
