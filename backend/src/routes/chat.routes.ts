import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../middleware/auth";
import { enforceMessageLimit } from "../middleware/messageLimit";
import { env } from "../config/env";
import {
  listConversations,
  getConversation,
  updateConversationTheme,
  deleteConversation,
  sendMessage,
} from "../controllers/chat.controller";

const router = Router();

const storage = multer.diskStorage({
  destination: env.uploadDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/zip",
      "application/x-zip-compressed",
      "application/pdf",
      "text/plain",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.get("/conversations", requireAuth, listConversations);
router.get("/conversations/:id", requireAuth, getConversation);
router.patch("/conversations/:id/theme", requireAuth, updateConversationTheme);
router.delete("/conversations/:id", requireAuth, deleteConversation);

router.post(
  "/messages",
  requireAuth,
  enforceMessageLimit,
  upload.array("attachments", 5) as unknown as import("express").RequestHandler,
  sendMessage
);

export default router;
