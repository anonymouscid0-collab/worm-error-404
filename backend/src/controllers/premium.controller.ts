import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth";
import { compareKey } from "../utils/premiumKey";

const activateSchema = z.object({
  key: z.string().min(6),
});

export async function activatePremiumKey(req: AuthRequest, res: Response) {
  const parsed = activateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Clé invalide." });
  }
  const { key } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (user.plan === "PRO") {
    return res.status(400).json({ error: "Votre compte est déjà en plan Pro." });
  }

  const candidates = await prisma.premiumKey.findMany({ where: { isUsed: false } });

  let matched: (typeof candidates)[number] | undefined;
  for (const candidate of candidates) {
    if (await compareKey(key, candidate.keyHash)) {
      matched = candidate;
      break;
    }
  }

  if (!matched) {
    return res.status(400).json({ error: "Clé Premium invalide ou déjà utilisée." });
  }

  await prisma.$transaction([
    prisma.premiumKey.update({
      where: { id: matched.id },
      data: { isUsed: true, usedAt: new Date() },
    }),
    prisma.premiumKeyRedemption.create({
      data: { userId: user.id, premiumKeyId: matched.id },
    }),
    prisma.subscription.create({
      data: { userId: user.id, plan: "PRO", status: "active" },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { plan: "PRO" },
    }),
  ]);

  return res.json({ success: true, message: "Plan Pro débloqué avec succès." });
}
