import "dotenv/config";
import { addKnowledge } from "../services/v4/knowledgeEngine";
import { prisma } from "../config/prisma";

const TOPICS: { title: string; tags: string[] }[] = [
  { title: "Python : syntaxe de base et types de données", tags: ["python", "syntax", "beginner"] },
  { title: "Python : fonctions, arguments et closures", tags: ["python", "functions"] },
  { title: "Python : classes, objets et héritage", tags: ["python", "oop"] },
  { title: "Python : décorateurs, expliqués avec des exemples", tags: ["python", "decorators", "advanced"] },
  { title: "Python : générateurs et itérateurs", tags: ["python", "generators", "advanced"] },
  { title: "Python : gestion des exceptions et bonnes pratiques", tags: ["python", "exceptions"] },
  { title: "Python : type hints et dataclasses", tags: ["python", "typing"] },
  { title: "Python : async/await et asyncio", tags: ["python", "async", "concurrency", "advanced"] },
  { title: "Python : threading vs multiprocessing", tags: ["python", "concurrency", "advanced"] },
  { title: "Python : gestion de la mémoire et profiling", tags: ["python", "performance", "advanced"] },
  { title: "Python : environnements virtuels et gestion de paquets", tags: ["python", "packaging"] },
  { title: "Python : FastAPI, construire une API REST", tags: ["python", "fastapi", "backend", "api"] },
  { title: "Python : Django, structure d'un projet", tags: ["python", "django", "backend"] },
  { title: "Python : Flask, bases et cas d'usage", tags: ["python", "flask", "backend"] },
  { title: "Python : authentification et autorisation dans une API", tags: ["python", "security", "api"] },
  { title: "Python : NumPy et Pandas, manipulation de données", tags: ["python", "data", "numpy", "pandas"] },
  { title: "Python : tests avec pytest et unittest", tags: ["python", "testing"] },
  { title: "Python : bonnes pratiques de code sécurisé", tags: ["python", "security", "secure-coding"] },
  { title: "Python : gestion des secrets et des dépendances", tags: ["python", "security", "dependencies"] },
  { title: "Python : design patterns courants", tags: ["python", "architecture", "design-patterns"] },
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
  console.log(`Génération de ${TOPICS.length} fiches de connaissance...`);

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
        language: "python",
      });

      console.log(`✅ enregistré : ${topic.title}`);

      // Respecter la limite de 20 requêtes/minute d'OpenRouter (gratuit)
      await new Promise((r) => setTimeout(r, 3500));
    } catch (err) {
      console.error(`❌ échec pour "${topic.title}" :`, (err as Error).message);
    }
  }

  console.log("Terminé.");
  await prisma.$disconnect();
}

main();
