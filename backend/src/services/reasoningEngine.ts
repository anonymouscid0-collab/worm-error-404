import { callWithFallback, ProviderKey } from "./providerManager";

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

function heuristicAnalyze(prompt: string): ReasoningResult {
  const text = prompt.trim();
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

  if (/mobile|android|apk|flutter|react native|ios/.test(lower)) stack.push("Flutter/Android ou React Native");
  if (/react|next\.js|nextjs/.test(lower)) stack.push("Next.js/React");
  if (/node|express|nestjs|backend|api/.test(lower)) stack.push("Node.js/TypeScript");
  if (/python|django|fastapi|flask/.test(lower)) stack.push("Python");
  if (/postgres|postgresql|database|base de données|prisma/.test(lower)) stack.push("PostgreSQL + Prisma");
  if (/docker|container|deploy|deployment/.test(lower)) stack.push("Docker");

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

  if (stack.length === 0) stack.push("TypeScript/Node.js par défaut");

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

async function aiAnalyze(prompt: string, providers: ProviderKey[]): Promise<ReasoningResult | null> {
  try {
    const result = await callWithFallback(
      [
        {
          role: "system",
          content:
            "Tu es un moteur de raisonnement technique. Analyse la demande et réponds UNIQUEMENT avec un objet JSON valide, " +
            'sans texte avant ni après, sans markdown, au format exact : {"objective": string, "assumptions": string[], ' +
            '"constraints": string[], "risks": string[], "architecture": string[], "recommendedStack": string[], ' +
            '"complexity": "low"|"medium"|"high"}',
        },
        { role: "user", content: prompt },
      ],
      providers,
      { maxTokens: 600, temperature: 0.2 }
    );

    if (!result.ok || !result.content) return null;

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.objective) return null;

    return {
      objective: String(parsed.objective),
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      architecture: Array.isArray(parsed.architecture) ? parsed.architecture : [],
      recommendedStack: Array.isArray(parsed.recommendedStack) ? parsed.recommendedStack : [],
      complexity: ["low", "medium", "high"].includes(parsed.complexity) ? parsed.complexity : "medium",
    };
  } catch (err) {
    console.error("reasoningEngine.aiAnalyze error:", err);
    return null;
  }
}

export class ReasoningEngine {
  async analyze(prompt: string, providers?: ProviderKey[]): Promise<ReasoningResult> {
    const text = prompt.trim();
    if (!text) {
      throw new Error("Impossible d'analyser une demande vide.");
    }

    if (providers && providers.length > 0) {
      const aiResult = await aiAnalyze(text, providers);
      if (aiResult) return aiResult;
    }

    return heuristicAnalyze(text);
  }
}

export const reasoningEngine = new ReasoningEngine();
