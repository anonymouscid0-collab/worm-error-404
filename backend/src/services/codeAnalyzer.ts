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
