import type { ProjectFiles, GeneratedFile } from "./fileGenerationEngine";

export type VerificationSeverity = "error" | "warning" | "info";

export interface VerificationIssue {
  severity: VerificationSeverity;
  code: string;
  message: string;
  file?: string;
}

export interface VerificationResult {
  valid: boolean;
  score: number;
  issues: VerificationIssue[];
  checkedFiles: number;
}

export class ProjectVerificationEngine {
  verify(project: ProjectFiles): VerificationResult {
    const issues: VerificationIssue[] = [];

    this.checkProject(project, issues);
    this.checkFiles(project.files, issues);
    this.checkCommonProjectFiles(project, issues);

    const errors = issues.filter((issue) => issue.severity === "error").length;
    const warnings = issues.filter((issue) => issue.severity === "warning").length;

    const score = Math.max(
      0,
      Math.min(100, 100 - errors * 20 - warnings * 5),
    );

    return {
      valid: errors === 0,
      score,
      issues,
      checkedFiles: project.files.length,
    };
  }

  private checkProject(
    project: ProjectFiles,
    issues: VerificationIssue[],
  ): void {
    if (!project.name.trim()) {
      issues.push({
        severity: "error",
        code: "PROJECT_NAME_MISSING",
        message: "Project name is missing.",
      });
    }

    if (project.files.length === 0) {
      issues.push({
        severity: "error",
        code: "PROJECT_EMPTY",
        message: "Project contains no files.",
      });
    }

    const paths = new Set<string>();

    for (const file of project.files) {
      const path = file.path.trim();

      if (!path) {
        issues.push({
          severity: "error",
          code: "FILE_PATH_MISSING",
          message: "A generated file has no path.",
        });
        continue;
      }

      if (paths.has(path)) {
        issues.push({
          severity: "error",
          code: "DUPLICATE_FILE",
          message: `Duplicate file path: ${path}`,
          file: path,
        });
      }

      paths.add(path);

      if (path.startsWith("../") || path.includes("/../")) {
        issues.push({
          severity: "error",
          code: "INVALID_FILE_PATH",
          message: `Invalid project path: ${path}`,
          file: path,
        });
      }
    }
  }

  private checkFiles(
    files: GeneratedFile[],
    issues: VerificationIssue[],
  ): void {
    for (const file of files) {
      if (file.content.trim().length === 0) {
        issues.push({
          severity: "warning",
          code: "EMPTY_FILE",
          message: "File contains no content.",
          file: file.path,
        });
      }

      if (file.content.includes("TODO")) {
        issues.push({
          severity: "info",
          code: "TODO_FOUND",
          message: "TODO marker detected.",
          file: file.path,
        });
      }

      if (
        /password\\s*=\\s*["'][^"']+["']/i.test(file.content) ||
        /api[_-]?key\\s*=\\s*["'][^"']+["']/i.test(file.content)
      ) {
        issues.push({
          severity: "warning",
          code: "POSSIBLE_HARDCODED_SECRET",
          message: "Possible hardcoded credential or API key detected.",
          file: file.path,
        });
      }
    }
  }

  private checkCommonProjectFiles(
    project: ProjectFiles,
    issues: VerificationIssue[],
  ): void {
    const paths = new Set(project.files.map((file) => file.path));

    const hasPackageJson = paths.has("package.json");
    const hasTsConfig = paths.has("tsconfig.json");

    if (hasTsConfig && !hasPackageJson) {
      issues.push({
        severity: "warning",
        code: "PACKAGE_JSON_MISSING",
        message: "TypeScript project has no package.json.",
      });
    }

    if (hasPackageJson) {
      const packageFile = project.files.find(
        (file) => file.path === "package.json",
      );

      if (packageFile) {
        try {
          JSON.parse(packageFile.content);
        } catch {
          issues.push({
            severity: "error",
            code: "INVALID_PACKAGE_JSON",
            message: "package.json is not valid JSON.",
            file: packageFile.path,
          });
        }
      }
    }
  }
}

export const projectVerificationEngine =
  new ProjectVerificationEngine();
