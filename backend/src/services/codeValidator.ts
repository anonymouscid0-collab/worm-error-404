import { codeAnalyzer, CodeAnalysis } from "./codeAnalyzer";
import { AIProject, ProjectEngine } from "./projectEngine";

export interface ValidationResult {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  analyses: CodeAnalysis[];
}

export class CodeValidator {
  constructor(private readonly projects = new ProjectEngine()) {}

  validateCode(code: string, language = "typescript"): ValidationResult {
    const analysis = codeAnalyzer.analyze(code, language);

    const errors = analysis.issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => {
        const line = issue.line ? ` Ligne ${issue.line}.` : "";
        return `${issue.message}${line}`;
      });

    const warnings = analysis.issues
      .filter((issue) => issue.severity === "warning")
      .map((issue) => {
        const line = issue.line ? ` Ligne ${issue.line}.` : "";
        return `${issue.message}${line}`;
      });

    return {
      valid: errors.length === 0,
      score: analysis.score,
      errors,
      warnings,
      analyses: [analysis]
    };
  }

  validateProject(project: AIProject): ValidationResult {
    const structuralErrors = this.projects.validateStructure(project);

    const analyses: CodeAnalysis[] = [];

    for (const file of project.files) {
      if (!file.content.trim()) continue;

      const language = file.language || this.detectLanguage(file.path);

      analyses.push(codeAnalyzer.analyze(file.content, language));
    }

    const errors = [...structuralErrors];

    const warnings: string[] = [];

    for (const analysis of analyses) {
      for (const issue of analysis.issues) {
        const prefix = `${analysis.language}: `;

        if (issue.severity === "error") {
          errors.push(prefix + issue.message);
        } else if (issue.severity === "warning") {
          warnings.push(prefix + issue.message);
        }
      }
    }

    const score =
      analyses.length === 0
        ? structuralErrors.length === 0
          ? 100
          : 0
        : Math.round(
            analyses.reduce((sum, item) => sum + item.score, 0) /
              analyses.length
          );

    return {
      valid: errors.length === 0,
      score,
      errors,
      warnings,
      analyses
    };
  }

  private detectLanguage(path: string): string {
    const ext = path.split(".").pop()?.toLowerCase();

    const map: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      php: "php",
      java: "java",
      kt: "kotlin",
      dart: "dart",
      rs: "rust",
      go: "go",
      cs: "csharp",
      cpp: "cpp",
      c: "c",
      sql: "sql",
      sh: "bash",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      yaml: "yaml",
      yml: "yaml"
    };

    return map[ext || ""] || "text";
  }
}

export const codeValidator = new CodeValidator();
