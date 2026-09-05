import { prisma } from "../config/prisma";

export type MemoryScope = "fact" | "preference" | "project" | "conversation" | "decision" | "technical";

export interface MemoryItem {
  id: string;
  content: string;
  scope: string;
}

const FACT_PATTERNS: { regex: RegExp; scope: MemoryScope }[] = [
  { regex: /je m'appelle ([a-zà-ÿ0-9 _-]{2,40})/i, scope: "fact" },
  { regex: /mon (?:projet|app|application) s'appelle ([a-zà-ÿ0-9 _-]{2,60})/i, scope: "project" },
  { regex: /j'utilise ([a-zà-ÿ0-9 .+#_-]{2,60})/i, scope: "technical" },
  { regex: /je pr[ée]f[èe]re ([a-zà-ÿ0-9 .+#_-]{2,80})/i, scope: "preference" },
  { regex: /je travaille (?:sur|avec) ([a-zà-ÿ0-9 .+#_-]{2,80})/i, scope: "project" },
];

export class MemoryEngine {
  async remember(userId: string, content: string, scope: MemoryScope = "conversation", key?: string) {
    if (key) {
      const existing = await prisma.memory.findFirst({ where: { userId, scope, key } });
      if (existing) {
        return prisma.memory.update({ where: { id: existing.id }, data: { content } });
      }
    }
    return prisma.memory.create({ data: { userId, scope, key, content } });
  }

  async extractAndRemember(userId: string, message: string): Promise<void> {
    for (const { regex, scope } of FACT_PATTERNS) {
      const match = message.match(regex);
      if (match) {
        const value = match[1].trim();
        await this.remember(userId, `${scope}: ${value}`, scope, scope).catch((err) =>
          console.error("memoryEngine.extractAndRemember error:", err)
        );
      }
    }
  }

  async search(userId: string | undefined, _query: string, limit = 5): Promise<MemoryItem[]> {
    if (!userId) return [];
    try {
      const rows = await prisma.memory.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });
      return rows.map((r) => ({ id: r.id, content: r.content, scope: r.scope }));
    } catch (err) {
      console.error("memoryEngine.search error:", err);
      return [];
    }
  }

  async forget(userId: string, memoryId: string) {
    return prisma.memory.deleteMany({ where: { id: memoryId, userId } });
  }
}

export const memoryEngine = new MemoryEngine();
