import { Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "./auth";

/**
 * Blocks chat access once a FREE user has used all their free messages.
 * PRO users bypass this check entirely.
 */
export async function enforceMessageLimit(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  if (user.plan === "PRO") {
    return next();
  }

  if (user.messagesUsed >= user.freeLimit) {
    return res.status(402).json({
      error: "FREE_LIMIT_REACHED",
      message: "Vous avez utilisé vos 15 messages gratuits.",
      upgradeUrl: "/premium",
    });
  }

  next();
}
