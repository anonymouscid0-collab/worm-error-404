import { contextEngine, ContextInput } from "./contextEngine";
import { reasoningEngine } from "./reasoningEngine";
import { taskPlanner } from "./taskPlanner";
import { projectEngine, AIProject } from "./projectEngine";
import { codeValidator } from "./codeValidator";

export interface OrchestrationResult {
  mode: "conversation" | "code" | "project" | "analysis";
  reasoning: ReturnType<typeof reasoningEngine.analyze>;
  plan?: ReturnType<typeof taskPlanner.createPlan>;
  context: ReturnType<typeof contextEngine.build>;
  project?: AIProject;
  validation?: ReturnType<typeof codeValidator.validateProject>;
}

export class AIOrchestrator {
  async analyze(input: ContextInput): Promise<OrchestrationResult> {
    const prompt = input.prompt.trim();

    if (!prompt) {
      throw new Error("Prompt vide.");
    }

    const context = contextEngine.build(input);
    const reasoning = reasoningEngine.analyze(prompt);

    const lower = prompt.toLowerCase();

    const wantsProject =
      /crée|creer|créer|build|développe|developpe|génère|genere|generate|projet|application|app|site complet|full.?stack|apk/.test(
        lower
      );

    const wantsCode =
      /code|script|fonction|component|classe|api|endpoint|backend|frontend|bug|debug|typescript|javascript|python|flutter/.test(
        lower
      );

    const wantsAnalysis =
      /analyse|analyser|review|audit|optimise|optimiser|architecture|erreur/.test(
        lower
      );

    const mode =
      wantsProject
        ? "project"
        : wantsAnalysis
          ? "analysis"
          : wantsCode
            ? "code"
            : "conversation";

    const result: OrchestrationResult = {
      mode,
      reasoning,
      context
    };

    if (mode === "project") {
      const plan = taskPlanner.createPlan(prompt, reasoning);

      const project = projectEngine.createProject(
        "worm-generated-project",
        prompt,
        plan.stack
      );

      result.plan = plan;
      result.project = project;
      result.validation = codeValidator.validateProject(project);
    }

    return result;
  }
}

export const aiOrchestrator = new AIOrchestrator();
