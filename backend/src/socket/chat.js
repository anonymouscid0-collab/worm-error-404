const wormBrain = require('../services/wormBrainV3');
const db = require('../services/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'worm-secret-key-change-me-prod';

function setupChatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Non authentifié'));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 Socket connecté:', socket.user?.email || socket.id);

    socket.on('chat:message', async ({ conversationId, content }) => {
      try {
        const user = db.getUserById(socket.user.id);
        if (!user) return socket.emit('chat:error', { error: 'Utilisateur non trouvé' });

        // ADMIN = ILLIMITÉ, sinon vérifier limite
        const isAdmin = user.role === 'ADMIN';
        if (!isAdmin && user.plan === 'FREE' && user.messagesUsed >= user.freeLimit) {
          socket.emit('chat:limit_reached');
          return;
        }

        // Incrémenter compteur (sauf admin)
        if (!isAdmin) {
          db.updateUser(user.id, { messagesUsed: (user.messagesUsed || 0) + 1 });
        }

        // Réponse IA
        const result = await wormBrain.generateResponse(content, {
          sessionId: conversationId,
          model: 'worm-fullstack-v3'
        });

        socket.emit('chat:reply', {
          message: {
            id: 'msg_' + Date.now(),
            sender: 'ASSISTANT',
            content: result.response,
            createdAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error('Socket chat error:', err);
        socket.emit('chat:error', { error: 'Erreur IA: ' + err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket déconnecté:', socket.user?.email || socket.id);
    });
  });
}

module.exports = setupChatSocket;
