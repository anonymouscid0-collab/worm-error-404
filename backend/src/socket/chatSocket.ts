import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { generateAiResponse, AiChatMessage } from '../services/aiService';

interface JwtPayload {
  userId: string;
  role: string;
}

export function setupChatSocket(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token manquant'));
    try {
      const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`🔌 Socket connecté: ${userId}`);

    socket.on('chat:message', async ({ conversationId, content }: { conversationId?: string; content: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return socket.emit('chat:error', { error: 'Utilisateur introuvable' });
        }

        // Vérifier limite messages gratuits
        if (user.plan === 'FREE' && user.messagesUsed >= user.freeLimit) {
          return socket.emit('chat:limit_reached');
        }

        // Créer ou utiliser conversation existante
        let convId = conversationId;
        if (!convId) {
          const conv = await prisma.conversation.create({
            data: { userId, title: content.slice(0, 60) },
          });
          convId = conv.id;
          socket.emit('chat:conversation_created', { conversationId: convId });
        }

        // Sauvegarder message utilisateur
        const userMessage = await prisma.message.create({
          data: { conversationId: convId, sender: 'USER', content },
        });
        socket.emit('chat:message_saved', { message: userMessage });

        // Récupérer historique complet
        const history = await prisma.message.findMany({
          where: { conversationId: convId },
          orderBy: { createdAt: 'asc' },
        });

        const aiHistory: AiChatMessage[] = history.map((m) => ({
          role: m.sender === 'USER' ? 'user' : 'assistant',
          content: m.content,
        }));

        // Appeler l'IA
        const aiResult = await generateAiResponse(aiHistory, [], user.plan as 'FREE' | 'PRO');

        // Sauvegarder réponse IA
        const assistantMessage = await prisma.message.create({
          data: {
            conversationId: convId,
            sender: 'ASSISTANT',
            content: aiResult.content,
            isDownloadable: aiResult.isDownloadable ?? false,
            downloadUrl: aiResult.downloadUrl ?? null,
            downloadFileName: aiResult.downloadFileName ?? null,
          },
        });

        // Incrémenter compteur si FREE
        if (user.plan === 'FREE') {
          await prisma.user.update({
            where: { id: userId },
            data: { messagesUsed: { increment: 1 } },
          });
        }

        socket.emit('chat:reply', { message: assistantMessage });
      } catch (err: any) {
        console.error('Socket chat error:', err);
        socket.emit('chat:error', { error: err.message || 'Erreur interne' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket déconnecté: ${userId}`);
    });
  });
}
