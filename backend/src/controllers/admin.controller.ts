import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth";
import { generateRawKey, hashKey } from "../utils/premiumKey";

import { generateAiResponse } from "../services/aiService";

// ---------- Test IA ----------
export async function testAi(req: AuthRequest, res: Response) {
  const schema = z.object({ message: z.string().min(1).default("Dis bonjour et présente-toi en une phrase.") });
  const parsed = schema.safeParse(req.body);
  const message = parsed.success ? parsed.data.message : "Dis bonjour et présente-toi en une phrase.";

  const result = await generateAiResponse([{ role: "user", content: message }]);
  return res.json({ response: result.content });
}

// ---------- Utilisateurs ----------
export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      messagesUsed: true,
      freeLimit: true,
      createdAt: true,
    },
  });
  return res.json({ users });
}

export async function updateUserPlan(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { plan } = req.body as { plan: "FREE" | "PRO" };
  const user = await prisma.user.update({ where: { id }, data: { plan } });
  return res.json({ user });
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.user.delete({ where: { id } });
  return res.json({ success: true });
}

// ---------- Statistiques ----------
export async function getStats(_req: AuthRequest, res: Response) {
  const [totalUsers, proUsers, totalConversations, totalMessages, unusedKeys] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: "PRO" } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.premiumKey.count({ where: { isUsed: false } }),
    ]);

  return res.json({
    totalUsers,
    proUsers,
    freeUsers: totalUsers - proUsers,
    totalConversations,
    totalMessages,
    unusedKeys,
  });
}

// ---------- Clés Premium ----------
export async function createPremiumKeys(req: AuthRequest, res: Response) {
  const schema = z.object({ count: z.number().int().min(1).max(500).default(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Nombre de clés invalide." });

  const { count } = parsed.data;
  const rawKeys: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = generateRawKey();
    const keyHash = await hashKey(raw);
    await prisma.premiumKey.create({ data: { keyHash } });
    rawKeys.push(raw);
  }

  // Les clés en clair ne sont retournées qu'une seule fois, à cet instant.
  return res.status(201).json({ keys: rawKeys });
}

export async function listPremiumKeys(_req: AuthRequest, res: Response) {
  const keys = await prisma.premiumKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, isUsed: true, createdAt: true, usedAt: true },
  });
  return res.json({ keys });
}

// ---------- Conversations ----------
export async function listAllConversations(_req: AuthRequest, res: Response) {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { messages: true } },
    },
  });
  return res.json({ conversations });
}

// ---------- Paramètres du site ----------
export async function getSettings(_req: AuthRequest, res: Response) {
  const settings = await prisma.siteSetting.findMany();
  return res.json({ settings });
}

export async function upsertSetting(req: AuthRequest, res: Response) {
  const schema = z.object({ key: z.string().min(1), value: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Paramètre invalide." });

  const { key, value } = parsed.data;
  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return res.json({ setting });
}

// ---------- Clés API (fournisseurs IA, etc.) ----------
export async function listApiKeys(_req: AuthRequest, res: Response) {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  // On masque la valeur complète dans la liste, on ne montre que les 4 derniers caractères.
  const masked = keys.map((k) => ({
    ...k,
    keyValue: `••••••••${k.keyValue.slice(-4)}`,
  }));
  return res.json({ keys: masked });
}

export async function createApiKey(req: AuthRequest, res: Response) {
  const schema = z.object({
    provider: z.string().min(1),
    label: z.string().min(1),
    keyValue: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Clé API invalide." });

  const key = await prisma.apiKey.create({ data: parsed.data });
  return res.status(201).json({ key: { ...key, keyValue: `••••••••${key.keyValue.slice(-4)}` } });
}

export async function deleteApiKey(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.apiKey.delete({ where: { id } });
  return res.json({ success: true });
}
