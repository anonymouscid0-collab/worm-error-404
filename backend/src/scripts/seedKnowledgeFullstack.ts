import "dotenv/config";
import { addKnowledge } from "../services/v4/knowledgeEngine";
import { prisma } from "../config/prisma";

const TOPICS: { title: string; tags: string[] }[] = [
  { title: "React : composants et props", tags: ["react", "frontend", "beginner"] },
  { title: "React : hooks (useState, useEffect, useMemo, useCallback)", tags: ["react", "hooks", "frontend"] },
  { title: "React : gestion d'état avancée (Context, Zustand, Redux)", tags: ["react", "state-management", "advanced"] },
  { title: "Next.js : App Router, layouts et Server Components", tags: ["nextjs", "react", "ssr"] },
  { title: "Next.js : rendu SSR, SSG et ISR", tags: ["nextjs", "rendering", "advanced"] },
  { title: "Next.js : API routes et Route Handlers", tags: ["nextjs", "api", "backend"] },
  { title: "Node.js : Event Loop et modèle asynchrone", tags: ["nodejs", "backend", "async"] },
  { title: "Node.js/Express : construire une API REST", tags: ["nodejs", "express", "api", "backend"] },
  { title: "API REST : conception (versioning, pagination, gestion des erreurs)", tags: ["api", "rest", "architecture"] },
  { title: "Authentification : JWT vs sessions", tags: ["auth", "security", "backend"] },
  { title: "Sécurité web : CORS, CSRF, XSS, injection", tags: ["security", "web", "owasp"] },
  { title: "WebSockets : temps réel avec Socket.IO", tags: ["websocket", "socketio", "realtime"] },
  { title: "Prisma : modélisation de schéma et requêtes", tags: ["prisma", "database", "orm"] },
  { title: "GraphQL : bases et comparaison avec REST", tags: ["graphql", "api", "advanced"] },
  { title: "Tests frontend : Jest et React Testing Library", tags: ["testing", "react", "jest"] },
  { title: "Tests backend : Node.js avec Jest et Supertest", tags: ["testing", "nodejs", "backend"] },
  { title: "Performance frontend : memoization, code splitting, lazy loading", tags: ["performance", "react", "advanced"] },
  { title: "Performance backend : caching, rate limiting, requêtes N+1", tags: ["performance", "backend", "advanced"] },
  { title: "Déploiement : conteneuriser une application Node.js avec Docker", tags: ["docker", "devops", "deployment"] },
  { title: "Architecture fullstack : monolithe vs microservices, quand choisir", tags: ["architecture", "microservices", "advanced"] },
];

async function generateOne(topic: { title: string; tags: string[] }) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.AI_MODEL || "openrouter/free";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://worm-error-404.onrender.com",
      "X-Title": "WORM ERROR 404 - Knowledge Seed",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Tu es un rédacteur technique senior. Réponds en français, de façon dense et précise, " +
            "avec des exemples de code courts quand c'est pertinent. Pas d'introduction, pas de conclusion, " +
            "va directement au contenu technique. 200 à 400 mots.",
        },
        { role: "user", content: `Rédige une fiche de connaissance technique sur : ${topic.title}` },
      ],
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) pour "${topic.title}"`);
  }

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Réponse vide pour "${topic.title}"`);

  return content as string;
}

async function main() {
  console.log(`Génération de ${TOPICS.length} fiches de connaissance (Fullstack)...`);

  for (const topic of TOPICS) {
    try {
      const existing = await prisma.knowledgeEntry.findFirst({ where: { title: topic.title } });
      if (existing) {
        console.log(`⏭  déjà présent : ${topic.title}`);
        continue;
      }

      console.log(`⏳ génération : ${topic.title}`);
      const content = await generateOne(topic);

      await addKnowledge({
        title: topic.title,
        content,
        tags: [...topic.tags, "seed"],
        source: "ai-seed",
        language: "javascript",
      });

      console.log(`✅ enregistré : ${topic.title}`);

      await new Promise((r) => setTimeout(r, 3500));
    } catch (err) {
      console.error(`❌ échec pour "${topic.title}" :`, (err as Error).message);
    }
  }

  console.log("Terminé.");
  await prisma.$disconnect();
}

main();
