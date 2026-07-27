import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import premiumRoutes from "./routes/premium.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import { registerChatSocket } from "./socket/chatSocket";

fs.mkdirSync(env.uploadDir, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.frontendUrl, credentials: true },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use("/uploads", express.static(path.resolve(env.uploadDir)));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "worm-error-404-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable (404)." });
});

registerChatSocket(io);

server.listen(env.port, () => {
  console.log(`WORM ERROR // 404 API listening on port ${env.port} [${env.nodeEnv}]`);
});
