import { memoryEngine } from "./memoryEngine";

export interface ContextInput {
  prompt: string;
  history?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  project?: {
    name: string;
    description?: string;
    stack?: string[];
    files?: string[];
  };
}

export interface AIContext {
  prompt: string;
  history: ContextInput["history"];
  projectContext: string;
  memories: string;
}

export class ContextEngine {
  build(input: ContextInput): AIContext {
    const memories = memoryEngine.search(input.prompt, 5);

    const projectContext = input.project
      ? [
          `Projet: ${input.project.name}`,
          input.project.description
            ? `Description: ${input.project.description}`
            : "",
          input.project.stack?.length
            ? `Stack: ${input.project.stack.join(", ")}`
            : "",
          input.project.files?.length
            ? `Fichiers: ${input.project.files.join(", ")}`
            : ""
        ]
          .filter(Boolean)
          .join("\n")
      : "Aucun projet actif.";

    return {
      prompt: input.prompt,
      history: input.history || [],
      projectContext,
      memories: memories.length
        ? memories.map((m) => `- ${m.content}`).join("\n")
        : "Aucune mémoire pertinente."
    };
  }
}

export const contextEngine = new ContextEngine();
