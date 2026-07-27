import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/prisma";
import { generateAiResponse, AiChatMessage } from "../services/aiService";

interface AuthedSocket extends Socket {
  userId?: string;
}

export function registerChatSocket(io: Server) {
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentification requise."));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error("Session invalide."));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    socket.join(`user:${socket.userId}`);

    socket.on(
      "chat:message",
      async (payload: { conversationId?: string; content: string }) => {
        try {
          const user = await prisma.user.findUnique({ where: { id: socket.userId } });
          if (!user) return socket.emit("chat:error", { error: "Utilisateur introuvable." });

          if (user.plan === "FREE" && user.messagesUsed >= user.freeLimit) {
            return socket.emit("chat:limit_reached", {
              message: "Vous avez utilisé vos 15 messages gratuits.",
              upgradeUrl: "/premium",
            });
          }

          let conversationId = payload.conversationId;
          if (!conversationId) {
            const conversation = await prisma.conversation.create({
              data: { userId: user.id, title: payload.content.slice(0, 60) },
            });
            conversationId = conversation.id;
            socket.emit("chat:conversation_created", { conversationId });
          }

          const userMessage = await prisma.message.create({
            data: { conversationId, sender: "USER", content: payload.content },
          });
          socket.emit("chat:message_saved", { message: userMessage });

          const history = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
          });
          const aiHistory: AiChatMessage[] = history.map((m) => ({
            role: m.sender === "USER" ? "user" : "assistant",
            content: m.content,
          }));

          const aiResult = await generateAiResponse(aiHistory);

          const assistantMessage = await prisma.message.create({
            data: { conversationId, sender: "ASSISTANT", content: aiResult.content },
          });

          if (user.plan === "FREE") {
            await prisma.user.update({
              where: { id: user.id },
              data: { messagesUsed: { increment: 1 } },
            });
          }

          socket.emit("chat:reply", {
            conversationId,
            message: assistantMessage,
            isDownloadable: aiResult.isDownloadable ?? false,
            downloadFileName: aiResult.downloadFileName,
          });
        } catch (err) {
          console.error("[socket] chat:message error", err);
          socket.emit("chat:error", { error: "Une erreur est survenue." });
        }
      }
    );

    socket.on("disconnect", () => {
      socket.leave(`user:${socket.userId}`);
    });
  });
}
