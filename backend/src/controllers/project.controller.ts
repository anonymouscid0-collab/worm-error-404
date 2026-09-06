import fs from "fs";
import path from "path";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/prisma";

export async function listProjects(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const versions = await prisma.projectVersion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      projectName: true,
      version: true,
      fileCount: true,
      zipUrl: true,
      createdAt: true,
    },
  });

  return res.json({ versions });
}

export async function getProjectVersion(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const version = await prisma.projectVersion.findFirst({
    where: { id, userId },
  });

  if (!version) {
    return res.status(404).json({ error: "Version de projet introuvable." });
  }

  return res.json({ version });
}

export async function downloadProjectZip(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const version = await prisma.projectVersion.findFirst({
    where: { id, userId },
  });

  if (!version) {
    return res.status(404).json({ error: "Version de projet introuvable ou accès refusé." });
  }

  const filePath = path.join(process.cwd(), version.zipUrl.replace(/^\//, ""));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Le fichier zip n'existe plus sur le serveur." });
  }

  return res.download(filePath, `${version.projectName}-v${version.version}.zip`);
}
