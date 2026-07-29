import { Router } from "express";
import { prisma } from "../config/prisma";
import jwt from "jsonwebtoken";

const router = Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Non autorisé." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès admin requis." });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide." });
  }
};

// Route pour devenir admin (premier arrivé premier servi)
router.post("/setup", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Non autorisé." });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as any;
    
    const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (adminExists) return res.status(403).json({ error: "Un admin existe déjà." });
    
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { role: "ADMIN" },
    });
    
    res.json({ message: "Vous êtes maintenant admin !", user });
  } catch {
    res.status(500).json({ error: "Erreur." });
  }
});

router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true,
        plan: true, messagesUsed: true, freeLimit: true,
        createdAt: true, googleId: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Impossible de supprimer." });
  }
});

router.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const [totalUsers, totalConversations, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
    ]);
    res.json({ totalUsers, totalConversations, totalMessages });
  } catch {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
