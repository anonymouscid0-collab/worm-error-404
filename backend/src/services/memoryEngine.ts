export interface MemoryItem {
  id: string;
  type: "conversation" | "project" | "decision" | "fact" | "technical";
  content: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
}

export class MemoryEngine {
  private readonly memories = new Map<string, MemoryItem>();

  remember(
    content: string,
    type: MemoryItem["type"] = "conversation",
    importance = 5
  ): MemoryItem {
    const now = new Date().toISOString();

    const item: MemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      content: content.trim(),
      importance: Math.max(1, Math.min(10, importance)),
      createdAt: now,
      updatedAt: now
    };

    this.memories.set(item.id, item);

    return item;
  }

  search(query: string, limit = 10): MemoryItem[] {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return [...this.memories.values()]
      .map((memory) => {
        const content = memory.content.toLowerCase();

        const matches = words.reduce(
          (score, word) => score + (content.includes(word) ? 1 : 0),
          0
        );

        return {
          memory,
          score: matches * 10 + memory.importance
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.memory);
  }

  get(id: string): MemoryItem | undefined {
    return this.memories.get(id);
  }

  forget(id: string): boolean {
    return this.memories.delete(id);
  }

  clear(): void {
    this.memories.clear();
  }

  getStats() {
    const byType: Record<string, number> = {};

    for (const memory of this.memories.values()) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
    }

    return {
      total: this.memories.size,
      byType
    };
  }
}

export const memoryEngine = new MemoryEngine();
