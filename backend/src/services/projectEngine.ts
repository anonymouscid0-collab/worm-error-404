export interface ProjectFile {
  path: string;
  content: string;
  language?: string;
  generated?: boolean;
}

export interface ProjectDependency {
  name: string;
  version: string;
  manager: "npm" | "pnpm" | "yarn" | "pip" | "pub" | "gradle" | "other";
}

export interface ProjectArtifact {
  name: string;
  type: "source" | "config" | "documentation" | "test" | "build";
  content: string;
}

export interface AIProject {
  id: string;
  name: string;
  description: string;
  stack: string[];
  files: ProjectFile[];
  dependencies: ProjectDependency[];
  artifacts: ProjectArtifact[];
  commands: string[];
  createdAt: string;
  updatedAt: string;
}

export class ProjectEngine {
  createProject(
    name: string,
    description: string,
    stack: string[] = []
  ): AIProject {
    const now = new Date().toISOString();

    return {
      id: this.slugify(`${name}-${Date.now()}`),
      name,
      description,
      stack,
      files: [],
      dependencies: [],
      artifacts: [],
      commands: [],
      createdAt: now,
      updatedAt: now
    };
  }

  addFile(project: AIProject, file: ProjectFile): AIProject {
    const normalized = file.path.replace(/^\/+/, "");

    const existing = project.files.findIndex(
      (item) => item.path === normalized
    );

    const nextFile = {
      ...file,
      path: normalized,
      generated: file.generated ?? true
    };

    if (existing >= 0) {
      project.files[existing] = nextFile;
    } else {
      project.files.push(nextFile);
    }

    project.updatedAt = new Date().toISOString();
    return project;
  }

  addDependency(
    project: AIProject,
    dependency: ProjectDependency
  ): AIProject {
    const existing = project.dependencies.find(
      (item) =>
        item.name === dependency.name &&
        item.manager === dependency.manager
    );

    if (!existing) {
      project.dependencies.push(dependency);
    }

    project.updatedAt = new Date().toISOString();
    return project;
  }

  addCommand(project: AIProject, command: string): AIProject {
    if (!project.commands.includes(command)) {
      project.commands.push(command);
    }

    project.updatedAt = new Date().toISOString();
    return project;
  }

  validateStructure(project: AIProject): string[] {
    const errors: string[] = [];

    const paths = new Set<string>();

    for (const file of project.files) {
      if (!file.path.trim()) {
        errors.push("Un fichier possède un chemin vide.");
      }

      if (paths.has(file.path)) {
        errors.push(`Fichier dupliqué : ${file.path}`);
      }

      paths.add(file.path);
    }

    if (project.files.length === 0) {
      errors.push("Le projet ne contient aucun fichier.");
    }

    return errors;
  }

  toManifest(project: AIProject) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      stack: project.stack,
      files: project.files.map((file) => file.path),
      dependencies: project.dependencies,
      commands: project.commands,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export const projectEngine = new ProjectEngine();
