export type ReasoningComplexity = "low" | "medium" | "high";

export interface ReasoningResult {
  objective: string;
  assumptions: string[];
  constraints: string[];
  risks: string[];
  architecture: string[];
  recommendedStack: string[];
  complexity: ReasoningComplexity;
}

export class ReasoningEngine {
  analyze(prompt: string): ReasoningResult {
    const text = prompt.trim();

    if (!text) {
      throw new Error("Impossible d'analyser une demande vide.");
    }

    const lower = text.toLowerCase();

    const complexity: ReasoningComplexity =
      /enterprise|scale|microservice|distributed|kernel|compiler|architecture|production|complexe|avancé/.test(lower)
        ? "high"
        : /simple|basic|basique|hello world|débutant|debutant/.test(lower)
          ? "low"
          : "medium";

    const constraints: string[] = [];
    const risks: string[] = [];
    const stack: string[] = [];

    if (/mobile|android|apk|flutter|react native|ios/.test(lower)) {
      stack.push("Flutter/Android ou React Native");
    }

    if (/react|next\.js|nextjs/.test(lower)) {
      stack.push("Next.js/React");
    }

    if (/node|express|nestjs|backend|api/.test(lower)) {
      stack.push("Node.js/TypeScript");
    }

    if (/python|django|fastapi|flask/.test(lower)) {
      stack.push("Python");
    }

    if (/postgres|postgresql|database|base de données|prisma/.test(lower)) {
      stack.push("PostgreSQL + Prisma");
    }

    if (/docker|container|deploy|deployment/.test(lower)) {
      stack.push("Docker");
    }

    if (/auth|login|register|jwt|oauth/.test(lower)) {
      constraints.push("Authentification et autorisation nécessaires");
      risks.push("Gestion des sessions, tokens et permissions");
    }

    if (/payment|paiement|stripe|paypal/.test(lower)) {
      constraints.push("Les secrets de paiement doivent rester côté serveur");
      risks.push("Validation serveur des paiements et protection contre les doubles transactions");
    }

    if (/production|prod|déployer|deploy/.test(lower)) {
      constraints.push("Configuration production");
      risks.push("Secrets, logs, monitoring, sauvegardes et rollback");
    }

    if (stack.length === 0) {
      stack.push("TypeScript/Node.js par défaut");
    }

    return {
      objective: text,
      assumptions: [
        "Le projet doit être réellement exécutable.",
        "Les secrets doivent être séparés du code source.",
        "L'architecture doit rester maintenable et extensible."
      ],
      constraints,
      risks,
      architecture: [
        "Séparation frontend/backend",
        "Services modulaires",
        "Validation des entrées",
        "Gestion centralisée des erreurs",
        "Tests automatisés"
      ],
      recommendedStack: [...new Set(stack)],
      complexity
    };
  }
}

export const reasoningEngine = new ReasoningEngine();
