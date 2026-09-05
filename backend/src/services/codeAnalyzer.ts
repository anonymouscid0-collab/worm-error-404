export interface CodeIssue {
  severity: "error" | "warning" | "info";
  category: "syntax" | "security" | "quality" | "architecture" | "dependency";
  message: string;
  line?: number;
  suggestion?: string;
}

export interface CodeAnalysis {
  language: string;
  score: number;
  issues: CodeIssue[];
  metrics: {
    lines: number;
    functions: number;
    imports: number;
    comments: number;
  };
}

export class CodeAnalyzer {
  analyze(code: string, language = "typescript"): CodeAnalysis {
    const lines = code.split(/\r?\n/);

    const issues: CodeIssue[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const lower = line.toLowerCase();

      if (
        /(password|secret|api[_-]?key|token)\s*[:=]\s*["'][^"']+["']/i.test(
          line
        )
      ) {
        issues.push({
          severity: "error",
          category: "security",
          message: "Possible secret codé en dur.",
          line: lineNumber,
          suggestion: "Utiliser une variable d'environnement ou un secret manager."
        });
      }

      if (/eval\s*\(/.test(line)) {
        issues.push({
          severity: "warning",
          category: "security",
          message: "Utilisation de eval détectée.",
          line: lineNumber,
          suggestion: "Éviter eval et utiliser une API sûre."
        });
      }

      if (/console\.log\(/.test(line) && process.env.NODE_ENV === "production") {
        issues.push({
          severity: "info",
          category: "quality",
          message: "Console log détecté dans le code.",
          line: lineNumber,
          suggestion: "Utiliser un système de logging structuré."
        });
      }

      if (/catch\s*\(\s*\)\s*\{\s*\}/.test(lower)) {
        issues.push({
          severity: "warning",
          category: "quality",
          message: "Exception silencieusement ignorée.",
          line: lineNumber,
          suggestion: "Logger ou traiter explicitement l'erreur."
        });
      }

      if (/select\s+.*\+\s*req|query\s*\(.*\+\s*req/i.test(line)) {
        issues.push({
          severity: "error",
          category: "security",
          message: "Construction potentiellement dangereuse d'une requête avec une entrée utilisateur.",
          line: lineNumber,
          suggestion: "Utiliser des paramètres liés ou un ORM correctement configuré."
        });
      }
    });

    const functions =
      (code.match(/\b(function|async\s+function)\b/g) || []).length +
      (code.match(/=>/g) || []).length;

    const imports =
      (code.match(/\bimport\s+/g) || []).length +
      (code.match(/\brequire\s*\(/g) || []).length;

    const comments =
      (code.match(/\/\/|\/\*|\*/g) || []).length;

    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;

    const score = Math.max(
      0,
      Math.min(100, 100 - errors * 20 - warnings * 7)
    );

    return {
      language,
      score,
      issues,
      metrics: {
        lines: lines.length,
        functions,
        imports,
        comments
      }
    };
  }
}

export const codeAnalyzer = new CodeAnalyzer();

interface ModelConfig {
  apiKey: string;
  apiUrl: string;
}

export async function aiReview(
  code: string,
  language: string,
  config: ModelConfig,
  model: string
): Promise<CodeIssue[]> {
  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "https://worm-error-404.onrender.com",
        "X-Title": "WORM ERROR 404 - Code Review",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Tu es un reviewer de code senior. Analyse le code fourni et détecte les vrais problèmes : bugs " +
              "logiques, erreurs de gestion d'exceptions, cas limites non gérés, incohérences de types, mauvaises " +
              "pratiques, problèmes de performance évidents. Ignore le style pur (formatage, nommage mineur). " +
              'Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour, au format : ' +
              '[{"severity": "error"|"warning"|"info", "category": "syntax"|"security"|"quality"|"architecture"|"dependency", "message": string, "line": number|null, "suggestion": string}]. ' +
              "Si le code est correct, réponds avec un tableau vide [].",
          },
          { role: "user", content: `Langage: ${language}\n\nCode à analyser :\n${code}` },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) return [];

    const data: any = await response.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((i: any) => i && typeof i.message === "string")
      .map((i: any): CodeIssue => ({
        severity: ["error", "warning", "info"].includes(i.severity) ? i.severity : "info",
        category: ["syntax", "security", "quality", "architecture", "dependency"].includes(i.category) ? i.category : "quality",
        message: String(i.message),
        line: typeof i.line === "number" ? i.line : undefined,
        suggestion: typeof i.suggestion === "string" ? i.suggestion : undefined,
      }));
  } catch (err) {
    console.error("codeAnalyzer.aiReview error:", err);
    return [];
  }
}

