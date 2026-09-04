import { prisma } from "../../config/prisma";

export interface KnowledgeEntryData {
  title: string;
  content: string;
  tags: string[];
  source?: string;
  language?: string;
}

export async function addKnowledge(entry: KnowledgeEntryData) {
  return prisma.knowledgeEntry.create({ data: entry });
}

export async function searchKnowledge(query: string, limit = 3) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    .slice(0, 8);

  if (terms.length === 0) return [];

  return prisma.knowledgeEntry.findMany({
    where: {
      OR: terms.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" as const } },
        { content: { contains: term, mode: "insensitive" as const } },
        { tags: { has: term } },
      ]),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
