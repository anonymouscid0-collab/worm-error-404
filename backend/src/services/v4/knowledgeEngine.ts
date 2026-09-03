export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  language?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeSearchResult extends KnowledgeEntry {
  score: number;
}

export class KnowledgeEngine {
  private entries = new Map<string, KnowledgeEntry>();

  add(entry: Omit<KnowledgeEntry, "createdAt" | "updatedAt">): KnowledgeEntry {
    const now = Date.now();

    const stored: KnowledgeEntry = {
      ...entry,
      createdAt: now,
      updatedAt: now,
    };

    this.entries.set(stored.id, stored);
    return stored;
  }

  update(
    id: string,
    changes: Partial<Omit<KnowledgeEntry, "id" | "createdAt">>,
  ): KnowledgeEntry | null {
    const existing = this.entries.get(id);

    if (!existing) {
      return null;
    }

    const updated: KnowledgeEntry = {
      ...existing,
      ...changes,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };

    this.entries.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  get(id: string): KnowledgeEntry | null {
    return this.entries.get(id) ?? null;
  }

  search(query: string, limit = 10): KnowledgeSearchResult[] {
    const terms = this.tokenize(query);

    if (terms.length === 0) {
      return [];
    }

    return [...this.entries.values()]
      .map((entry) => ({
        ...entry,
        score: this.calculateScore(entry, terms),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, limit));
  }

  list(): KnowledgeEntry[] {
    return [...this.entries.values()];
  }

  clear(): void {
    this.entries.clear();
  }

  size(): number {
    return this.entries.size;
  }

  private calculateScore(
    entry: KnowledgeEntry,
    terms: string[],
  ): number {
    const title = this.normalize(entry.title);
    const content = this.normalize(entry.content);
    const tags = entry.tags.map((tag) => this.normalize(tag));

    let score = 0;

    for (const term of terms) {
      if (title.includes(term)) {
        score += 5;
      }

      if (content.includes(term)) {
        score += 2;
      }

      if (tags.some((tag) => tag.includes(term))) {
        score += 4;
      }
    }

    return score;
  }

  private tokenize(value: string): string[] {
    return [...new Set(
      this.normalize(value)
        .split(/\s+/)
        .filter((term) => term.length >= 2),
    )];
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }
}

export const knowledgeEngine = new KnowledgeEngine();
