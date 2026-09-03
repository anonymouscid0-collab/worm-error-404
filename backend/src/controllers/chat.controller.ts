import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth";
import { generateAiResponse, AiChatMessage } from "../services/aiService";

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1),
});

export async function listConversations(req: AuthRequest, res: Response) {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, theme: true, createdAt: true, updatedAt: true },
  });
  return res.json({ conversations });
}

export async function getConversation(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: req.user!.userId },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } } },
  });
  if (!conversation) return res.status(404).json({ error: "Conversation introuvable." });
  return res.json({ conversation });
}

export async function updateConversationTheme(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { theme } = req.body as { theme: string };
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!conversation) return res.status(404).json({ error: "Conversation introuvable." });

  const updated = await prisma.conversation.update({
    where: { id },
    data: { theme },
  });
  return res.json({ conversation: updated });
}

export async function deleteConversation(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!conversation) return res.status(404).json({ error: "Conversation introuvable." });
  await prisma.conversation.delete({ where: { id } });
  return res.json({ success: true });
}

/**
 * Sends a user message (with optional uploaded attachments already saved by the
 * upload middleware), increments the free-message counter, calls the AI, and
 * stores both messages. Used by the REST fallback; the Socket.IO handler in
 * src/socket/chatSocket.ts mirrors this logic for real-time delivery.
 */
export async function sendMessage(req: AuthRequest, res: Response) {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { content } = parsed.data;
  let { conversationId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: { userId: user.id, title: content.slice(0, 60) },
    });
    conversationId = conversation.id;
  }

  const userMessage = await prisma.message.create({
    data: { conversationId, sender: "USER", content },
  });

  const uploadedFiles = ((req.files as Express.Multer.File[]) ?? []).map((f) => ({
    fileName: f.originalname,
    fileType: f.mimetype,
    fileUrl: `/uploads/${f.filename}`,
  }));

  if (uploadedFiles.length > 0) {
    await prisma.attachment.createMany({
      data: uploadedFiles.map((f) => ({ ...f, messageId: userMessage.id })),
    });
  }

  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  const aiHistory: AiChatMessage[] = history.map((m) => ({
    role: m.sender === "USER" ? "user" : "assistant",
    content: m.content,
  }));

  const aiResult = await generateAiResponse(aiHistory, uploadedFiles, user.plan as "FREE" | "PRO");

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      sender: "ASSISTANT",
      content: aiResult.content,
      isDownloadable: aiResult.isDownloadable ?? false,
      downloadUrl: aiResult.downloadUrl ?? null,
      downloadFileName: aiResult.downloadFileName ?? null,
    },
  });

  if (user.plan === "FREE") {
    await prisma.user.update({
      where: { id: user.id },
      data: { messagesUsed: { increment: 1 } },
    });
  }

  return res.status(201).json({
    conversationId,
    userMessage,
    assistantMessage,
    isDownloadable: aiResult.isDownloadable ?? false,
    downloadFileName: aiResult.downloadFileName,
  });
}

export async function createConversation(req: AuthRequest, res: Response) {
  const { title } = req.body as { title?: string };
  const conversation = await prisma.conversation.create({
    data: { 
      userId: req.user!.userId, 
      title: title || "Nouvelle conversation" 
    },
  });
  return res.status(201).json({ conversation });
}
