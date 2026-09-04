import "dotenv/config";
import { addKnowledge } from "../services/v4/knowledgeEngine";
import { prisma } from "../config/prisma";

interface Topic {
  title: string;
  tags: string[];
  language: string;
}

const TOPICS: Topic[] = [
  // JavaScript / TypeScript (langage, complément au script Fullstack)
  { title: "JavaScript : closures et portée lexicale", tags: ["javascript", "language"], language: "javascript" },
  { title: "JavaScript : prototypes et héritage prototypal", tags: ["javascript", "language", "advanced"], language: "javascript" },
  { title: "JavaScript : Event Loop, microtasks et macrotasks", tags: ["javascript", "async", "advanced"], language: "javascript" },
  { title: "JavaScript : Promises et async/await", tags: ["javascript", "async"], language: "javascript" },
  { title: "TypeScript : types génériques", tags: ["typescript", "generics"], language: "typescript" },
  { title: "TypeScript : types utilitaires (Partial, Pick, Omit, Record)", tags: ["typescript", "types"], language: "typescript" },
  { title: "TypeScript : interfaces vs types", tags: ["typescript", "types"], language: "typescript" },
  { title: "JavaScript : destructuring et spread/rest operator", tags: ["javascript", "language"], language: "javascript" },
  { title: "JavaScript : modules ES vs CommonJS", tags: ["javascript", "modules"], language: "javascript" },
  { title: "JavaScript : gestion de la mémoire et garbage collection", tags: ["javascript", "performance", "advanced"], language: "javascript" },
  { title: "TypeScript : configuration tsconfig et modes strict", tags: ["typescript", "config"], language: "typescript" },
  { title: "JavaScript : manipulation du DOM et événements", tags: ["javascript", "dom", "web"], language: "javascript" },
  { title: "JavaScript : Map, Set et structures de données modernes", tags: ["javascript", "data-structures"], language: "javascript" },
  { title: "TypeScript : décorateurs et métadonnées", tags: ["typescript", "advanced"], language: "typescript" },
  { title: "JavaScript : tests unitaires avec Vitest/Jest", tags: ["javascript", "testing"], language: "javascript" },

  { title: "Java : POO, classes et interfaces", tags: ["java", "oop"], language: "java" },
  { title: "Java : collections (List, Map, Set) et leurs implémentations", tags: ["java", "collections"], language: "java" },
  { title: "Java : gestion des exceptions checked vs unchecked", tags: ["java", "exceptions"], language: "java" },
  { title: "Java : streams et programmation fonctionnelle", tags: ["java", "streams"], language: "java" },
  { title: "Java : multithreading et concurrence", tags: ["java", "concurrency", "advanced"], language: "java" },
  { title: "Java : Spring Boot, structure d'un projet", tags: ["java", "spring", "backend"], language: "java" },
  { title: "Java : injection de dépendances avec Spring", tags: ["java", "spring", "advanced"], language: "java" },
  { title: "Java : JPA/Hibernate, mapping objet-relationnel", tags: ["java", "orm", "database"], language: "java" },
  { title: "Java : gestion de la mémoire et garbage collector", tags: ["java", "performance", "advanced"], language: "java" },
  { title: "Java : tests avec JUnit et Mockito", tags: ["java", "testing"], language: "java" },
  { title: "Java : Maven vs Gradle", tags: ["java", "build-tools"], language: "java" },
  { title: "Java : bonnes pratiques de code sécurisé", tags: ["java", "security"], language: "java" },

  { title: "C# : POO et propriétés", tags: ["csharp", "oop"], language: "csharp" },
  { title: "C# : LINQ, requêtes sur collections", tags: ["csharp", "linq"], language: "csharp" },
  { title: "C# : async/await et Task", tags: ["csharp", "async"], language: "csharp" },
  { title: "C# : ASP.NET Core, construire une API", tags: ["csharp", "aspnet", "backend"], language: "csharp" },
  { title: "C# : Entity Framework Core", tags: ["csharp", "orm", "database"], language: "csharp" },
  { title: "C# : gestion des exceptions", tags: ["csharp", "exceptions"], language: "csharp" },
  { title: "C# : delegates et events", tags: ["csharp", "advanced"], language: "csharp" },
  { title: "C# : nullable reference types", tags: ["csharp", "types"], language: "csharp" },
  { title: "C# : tests avec xUnit", tags: ["csharp", "testing"], language: "csharp" },
  { title: "C# : dependency injection dans .NET", tags: ["csharp", "aspnet", "advanced"], language: "csharp" },

  { title: "Go : goroutines et channels", tags: ["go", "concurrency"], language: "go" },
  { title: "Go : gestion des erreurs (pattern error)", tags: ["go", "error-handling"], language: "go" },
  { title: "Go : interfaces et duck typing", tags: ["go", "language"], language: "go" },
  { title: "Go : structs et méthodes", tags: ["go", "language"], language: "go" },
  { title: "Go : gestion de la mémoire et garbage collector", tags: ["go", "performance"], language: "go" },
  { title: "Go : construire une API REST avec net/http", tags: ["go", "api", "backend"], language: "go" },
  { title: "Go : modules et gestion des dépendances", tags: ["go", "packaging"], language: "go" },
  { title: "Go : tests avec le package testing", tags: ["go", "testing"], language: "go" },
  { title: "Go : context et annulation", tags: ["go", "advanced"], language: "go" },
  { title: "Go : bonnes pratiques de code idiomatique", tags: ["go", "best-practices"], language: "go" },

  { title: "Rust : ownership, borrowing et lifetimes", tags: ["rust", "memory"], language: "rust" },
  { title: "Rust : gestion des erreurs (Result, Option)", tags: ["rust", "error-handling"], language: "rust" },
  { title: "Rust : traits et génériques", tags: ["rust", "generics"], language: "rust" },
  { title: "Rust : gestion de la mémoire sans garbage collector", tags: ["rust", "memory", "advanced"], language: "rust" },
  { title: "Rust : concurrence sûre (threads, async)", tags: ["rust", "concurrency", "advanced"], language: "rust" },
  { title: "Rust : cargo et gestion des dépendances", tags: ["rust", "packaging"], language: "rust" },
  { title: "Rust : pattern matching", tags: ["rust", "language"], language: "rust" },
  { title: "Rust : construire une API avec Actix ou Axum", tags: ["rust", "api", "backend"], language: "rust" },
  { title: "Rust : tests unitaires et intégration", tags: ["rust", "testing"], language: "rust" },
  { title: "Rust : unsafe Rust, quand et pourquoi l'éviter", tags: ["rust", "advanced", "security"], language: "rust" },

  { title: "C : gestion manuelle de la mémoire (malloc/free)", tags: ["c", "memory"], language: "c" },
  { title: "C : pointeurs et arithmétique de pointeurs", tags: ["c", "pointers"], language: "c" },
  { title: "C++ : POO, classes et héritage", tags: ["cpp", "oop"], language: "cpp" },
  { title: "C++ : RAII et gestion des ressources", tags: ["cpp", "memory", "advanced"], language: "cpp" },
  { title: "C++ : pointeurs intelligents (unique_ptr, shared_ptr)", tags: ["cpp", "memory"], language: "cpp" },
  { title: "C++ : templates et programmation générique", tags: ["cpp", "templates", "advanced"], language: "cpp" },
  { title: "C : gestion des erreurs et codes de retour", tags: ["c", "error-handling"], language: "c" },
  { title: "C++ : STL, conteneurs et algorithmes", tags: ["cpp", "stl"], language: "cpp" },
  { title: "C/C++ : vulnérabilités mémoire courantes (buffer overflow, use-after-free)", tags: ["c", "cpp", "security"], language: "cpp" },
  { title: "C++ : compilation, CMake et gestion de projet", tags: ["cpp", "build-tools"], language: "cpp" },

  { title: "Kotlin : bases du langage pour Android", tags: ["kotlin", "android", "mobile"], language: "kotlin" },
  { title: "Android : cycle de vie d'une Activity/Fragment", tags: ["android", "mobile"], language: "kotlin" },
  { title: "Android : Jetpack Compose, bases de l'UI déclarative", tags: ["android", "compose", "mobile"], language: "kotlin" },
  { title: "Swift : bases du langage pour iOS", tags: ["swift", "ios", "mobile"], language: "swift" },
  { title: "iOS : cycle de vie d'une app et SwiftUI", tags: ["ios", "swiftui", "mobile"], language: "swift" },
  { title: "Flutter/Dart : bases du langage et widgets", tags: ["flutter", "dart", "mobile"], language: "dart" },
  { title: "Flutter : gestion d'état (Provider, Riverpod, Bloc)", tags: ["flutter", "state-management", "mobile"], language: "dart" },
  { title: "React Native : bases et différences avec React web", tags: ["react-native", "mobile"], language: "javascript" },
  { title: "Mobile : stockage local (SQLite, Room, CoreData)", tags: ["mobile", "database"], language: "mobile" },
  { title: "Mobile : appels API et gestion réseau", tags: ["mobile", "api"], language: "mobile" },
  { title: "Mobile : notifications push", tags: ["mobile", "notifications"], language: "mobile" },
  { title: "Mobile : permissions et sécurité des données", tags: ["mobile", "security"], language: "mobile" },
  { title: "Android : structure d'un projet, build Gradle et génération d'un APK", tags: ["android", "gradle", "apk", "mobile"], language: "kotlin" },
  { title: "iOS : structure d'un projet Xcode et build", tags: ["ios", "xcode", "mobile"], language: "swift" },
  { title: "Mobile : tests unitaires et UI sur Android/iOS", tags: ["mobile", "testing"], language: "mobile" },

  { title: "Git : branches, merge et rebase", tags: ["git", "devops"], language: "devops" },
  { title: "Git : résolution de conflits", tags: ["git", "devops"], language: "devops" },
  { title: "Linux : gestion des processus et permissions", tags: ["linux", "devops"], language: "devops" },
  { title: "Linux : administration système de base (systemd, logs)", tags: ["linux", "devops"], language: "devops" },
  { title: "Docker : images, conteneurs et Dockerfile", tags: ["docker", "devops"], language: "devops" },
  { title: "Docker Compose : orchestrer plusieurs services", tags: ["docker", "devops"], language: "devops" },
  { title: "Kubernetes : concepts de base (pods, services, deployments)", tags: ["kubernetes", "devops", "advanced"], language: "devops" },
  { title: "CI/CD : principes et pipelines (GitHub Actions)", tags: ["cicd", "devops"], language: "devops" },
  { title: "Nginx : reverse proxy et configuration de base", tags: ["nginx", "devops"], language: "devops" },
  { title: "Terraform : infrastructure as code, principes", tags: ["terraform", "devops", "advanced"], language: "devops" },
  { title: "Monitoring : logs, métriques et alerting", tags: ["monitoring", "devops"], language: "devops" },
  { title: "DevOps : gestion des secrets et variables d'environnement", tags: ["devops", "security"], language: "devops" },
  { title: "Réseaux : DNS et résolution de noms", tags: ["networking", "devops"], language: "devops" },
  { title: "Cloud : concepts de base (AWS/GCP/Azure)", tags: ["cloud", "devops"], language: "devops" },
  { title: "DevOps : stratégies de déploiement (blue-green, canary)", tags: ["devops", "deployment", "advanced"], language: "devops" },

  { title: "SQL : jointures et sous-requêtes", tags: ["sql", "database"], language: "sql" },
  { title: "SQL : index et optimisation de requêtes", tags: ["sql", "performance"], language: "sql" },
  { title: "PostgreSQL : spécificités et fonctionnalités avancées", tags: ["postgresql", "database", "advanced"], language: "sql" },
  { title: "Bases relationnelles : normalisation", tags: ["database", "design"], language: "sql" },
  { title: "MongoDB : modélisation de documents", tags: ["mongodb", "nosql"], language: "nosql" },
  { title: "Redis : cas d'usage (cache, sessions, files d'attente)", tags: ["redis", "cache"], language: "nosql" },
  { title: "Transactions : ACID et niveaux d'isolation", tags: ["database", "transactions", "advanced"], language: "sql" },
  { title: "Bases de données : réplication et sharding", tags: ["database", "scalability", "advanced"], language: "sql" },
  { title: "SQL : injections et prévention", tags: ["sql", "security"], language: "sql" },
  { title: "Bases de données : migrations et gestion de schéma", tags: ["database", "migrations"], language: "sql" },
  { title: "Elasticsearch : recherche full-text, principes", tags: ["elasticsearch", "search"], language: "nosql" },
  { title: "Bases de données : choisir SQL vs NoSQL selon le cas d'usage", tags: ["database", "architecture"], language: "sql" },

  { title: "Machine Learning : apprentissage supervisé vs non supervisé", tags: ["ai", "ml", "fundamentals"], language: "ai" },
  { title: "Réseaux de neurones : principes de base", tags: ["ai", "neural-networks"], language: "ai" },
  { title: "NLP : tokenisation et embeddings", tags: ["ai", "nlp"], language: "ai" },
  { title: "LLMs : principes de fonctionnement (transformers, attention)", tags: ["ai", "llm", "advanced"], language: "ai" },
  { title: "RAG : retrieval-augmented generation, principes", tags: ["ai", "rag", "advanced"], language: "ai" },
  { title: "Vector databases : cas d'usage et fonctionnement", tags: ["ai", "vector-db"], language: "ai" },
  { title: "Machine Learning : overfitting et régularisation", tags: ["ai", "ml"], language: "ai" },
  { title: "Python pour l'IA : PyTorch, bases", tags: ["ai", "python", "pytorch"], language: "ai" },
  { title: "Prompt engineering : bonnes pratiques", tags: ["ai", "prompt-engineering"], language: "ai" },
  { title: "IA : évaluation de modèles (métriques courantes)", tags: ["ai", "evaluation"], language: "ai" },
  { title: "Computer Vision : principes de base", tags: ["ai", "computer-vision"], language: "ai" },
  { title: "IA : considérations éthiques et biais", tags: ["ai", "ethics"], language: "ai" },

  { title: "Pentest : méthodologie et phases (reconnaissance à rapport)", tags: ["security", "pentest"], language: "security" },
  { title: "Pentest : périmètre légal et autorisation", tags: ["security", "pentest", "legal"], language: "security" },
  { title: "Analyse de vulnérabilités : principes du scanning (usage défensif)", tags: ["security", "vulnerability-scanning"], language: "security" },
  { title: "Nmap : usage pour l'audit réseau autorisé", tags: ["security", "nmap"], language: "security" },
  { title: "Wireshark : analyse de trafic réseau", tags: ["security", "wireshark", "network-forensics"], language: "security" },
  { title: "Burp Suite : usage pour tests d'applications web autorisés", tags: ["security", "burp-suite", "appsec"], language: "security" },
  { title: "Malware : analyse statique, principes", tags: ["security", "malware-analysis"], language: "security" },
  { title: "Malware : analyse dynamique et sandboxing", tags: ["security", "malware-analysis", "advanced"], language: "security" },
  { title: "Forensics : analyse mémoire, principes", tags: ["security", "forensics"], language: "security" },
  { title: "Forensics : analyse de disque et gestion de la preuve", tags: ["security", "forensics"], language: "security" },
  { title: "Threat Hunting : méthodologie", tags: ["security", "threat-hunting"], language: "security" },
  { title: "Sécurité Windows : Active Directory et Kerberos, notions", tags: ["security", "windows", "active-directory"], language: "security" },
  { title: "Sécurité Linux : durcissement système (hardening)", tags: ["security", "linux"], language: "security" },
  { title: "Detection Engineering : règles Sigma et YARA, principes", tags: ["security", "detection-engineering"], language: "security" },
  { title: "Sécurité applicative : SAST vs DAST", tags: ["security", "appsec"], language: "security" },
];

async function generateOne(topic: Topic) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.AI_MODEL || "openrouter/free";

  const isSecurity = topic.language === "security";

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
          content: isSecurity
            ? "Tu es un rédacteur technique senior spécialisé en cybersécurité défensive. Réponds en français, " +
              "de façon dense et précise. Reste strictement conceptuel et défensif : détection, prévention, " +
              "méthodologie et analyse, jamais de technique d'attaque opérationnelle ni de code d'exploitation. " +
              "Pas d'introduction, pas de conclusion. 200 à 400 mots."
            : "Tu es un rédacteur technique senior. Réponds en français, de façon dense et précise, avec des " +
              "exemples de code courts quand c'est pertinent. Pas d'introduction, pas de conclusion, va " +
              "directement au contenu technique. 200 à 400 mots.",
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
  console.log(`Génération de ${TOPICS.length} fiches de connaissance (domaines restants)...`);
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const topic of TOPICS) {
    try {
      const existing = await prisma.knowledgeEntry.findFirst({ where: { title: topic.title } });
      if (existing) {
        console.log(`⏭  déjà présent : ${topic.title}`);
        skipped++;
        continue;
      }

      console.log(`⏳ génération : ${topic.title}`);
      const content = await generateOne(topic);

      await addKnowledge({
        title: topic.title,
        content,
        tags: [...topic.tags, "seed"],
        source: "ai-seed",
        language: topic.language,
      });

      console.log(`✅ enregistré : ${topic.title}`);
      done++;

      await new Promise((r) => setTimeout(r, 3500));
    } catch (err) {
      console.error(`❌ échec pour "${topic.title}" :`, (err as Error).message);
      failed++;
      if ((err as Error).message.includes("429")) {
        console.log("Quota atteint (429). Arrêt du script — relance-le demain, il reprendra où il s'est arrêté.");
        break;
      }
    }
  }

  console.log(`Terminé. ${done} générées, ${skipped} déjà présentes, ${failed} échecs.`);
  await prisma.$disconnect();
}

main();
