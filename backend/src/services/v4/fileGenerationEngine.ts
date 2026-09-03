export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
  description?: string;
}

export interface ProjectFiles {
  name: string;
  files: GeneratedFile[];
}

export class FileGenerationEngine {
  createFile(
    path: string,
    content: string,
    options: {
      language?: string;
      description?: string;
    } = {},
  ): GeneratedFile {
    if (!path.trim()) {
      throw new Error("File path cannot be empty.");
    }

    return {
      path: this.normalizePath(path),
      content,
      language: options.language,
      description: options.description,
    };
  }

  createProject(
    name: string,
    files: GeneratedFile[],
  ): ProjectFiles {
    if (!name.trim()) {
      throw new Error("Project name cannot be empty.");
    }

    return {
      name: name.trim(),
      files: files.map((file) => ({
        ...file,
        path: this.normalizePath(file.path),
      })),
    };
  }

  addFile(
    project: ProjectFiles,
    file: GeneratedFile,
  ): ProjectFiles {
    const normalized = {
      ...file,
      path: this.normalizePath(file.path),
    };

    const existingIndex = project.files.findIndex(
      (item) => item.path === normalized.path,
    );

    const files = [...project.files];

    if (existingIndex >= 0) {
      files[existingIndex] = normalized;
    } else {
      files.push(normalized);
    }

    return {
      ...project,
      files,
    };
  }

  removeFile(
    project: ProjectFiles,
    path: string,
  ): ProjectFiles {
    const normalizedPath = this.normalizePath(path);

    return {
      ...project,
      files: project.files.filter(
        (file) => file.path !== normalizedPath,
      ),
    };
  }

  getFile(
    project: ProjectFiles,
    path: string,
  ): GeneratedFile | null {
    const normalizedPath = this.normalizePath(path);

    return (
      project.files.find(
        (file) => file.path === normalizedPath,
      ) ?? null
    );
  }

  validateProject(project: ProjectFiles): string[] {
    const errors: string[] = [];

    if (!project.name.trim()) {
      errors.push("Project name is empty.");
    }

    if (project.files.length === 0) {
      errors.push("Project contains no files.");
    }

    const paths = new Set<string>();

    for (const file of project.files) {
      if (!file.path) {
        errors.push("A file has an empty path.");
        continue;
      }

      if (paths.has(file.path)) {
        errors.push(`Duplicate file: ${file.path}`);
      }

      paths.add(file.path);
    }

    return errors;
  }

  toManifest(project: ProjectFiles): string {
    return JSON.stringify(
      {
        name: project.name,
        fileCount: project.files.length,
        files: project.files.map((file) => ({
          path: file.path,
          language: file.language,
          description: file.description,
        })),
      },
      null,
      2,
    );
  }

  private normalizePath(path: string): string {
    return path
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/");
  }
}

export const fileGenerationEngine = new FileGenerationEngine();
