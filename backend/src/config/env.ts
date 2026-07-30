import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",

  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  jwtSecret: required("JWT_SECRET", "dev-secret"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",

  freeMessageLimit: parseInt(process.env.FREE_MESSAGE_LIMIT ?? "15", 10),

  aiApiKey: process.env.AI_API_KEY ?? "",
  aiApiUrl: process.env.AI_API_URL ?? "",
  aiSystemPrompt: process.env.AI_SYSTEM_PROMPT ?? "",
  aiModel: process.env.AI_MODEL ?? "claude-4.6-sonnet",

  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? "25", 10),
};
