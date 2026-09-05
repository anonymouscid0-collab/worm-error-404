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

interface ModelConfig {
  apiKey: string;
  apiUrl: string;
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

async function aiAnalyze(prompt: string, config: ModelConfig, model: string): Promise<ReasoningResult | null> {
  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "https://worm-error-404.onrender.com",
        "X-Title": "WORM ERROR 404 - Reasoning",
      },
      body: JSON.stringify({
        model,
        messages: [
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
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) return null;

    const data: any = await response.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
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
  async analyze(prompt: string, config?: ModelConfig, model?: string): Promise<ReasoningResult> {
    const text = prompt.trim();
    if (!text) {
      throw new Error("Impossible d'analyser une demande vide.");
    }

    if (config?.apiKey) {
      const aiResult = await aiAnalyze(text, config, model || "openrouter/free");
      if (aiResult) return aiResult;
    }

    return heuristicAnalyze(text);
  }
}

export const reasoningEngine = new ReasoningEngine();
