import { ReasoningResult } from "./reasoningEngine";

export interface PlannedTask {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  priority: "critical" | "high" | "medium" | "low";
  completed: boolean;
}

export interface ProjectPlan {
  objective: string;
  architecture: string[];
  tasks: PlannedTask[];
  stack: string[];
}

export class TaskPlanner {
  createPlan(objective: string, reasoning: ReasoningResult): ProjectPlan {
    const tasks: PlannedTask[] = [
      {
        id: "architecture",
        title: "Architecture",
        description: "Définir la structure globale du projet et les responsabilités de chaque couche.",
        dependencies: [],
        priority: "critical",
        completed: false
      },
      {
        id: "database",
        title: "Base de données",
        description: "Définir les modèles, relations, index et migrations nécessaires.",
        dependencies: ["architecture"],
        priority: "high",
        completed: false
      },
      {
        id: "backend",
        title: "Backend",
        description: "Créer les services, contrôleurs, routes, validation et gestion des erreurs.",
        dependencies: ["architecture", "database"],
        priority: "critical",
        completed: false
      },
      {
        id: "frontend",
        title: "Frontend",
        description: "Construire l'interface utilisateur et connecter les API.",
        dependencies: ["backend"],
        priority: "high",
        completed: false
      },
      {
        id: "authentication",
        title: "Authentification",
        description: "Implémenter les comptes, sessions, permissions et protections nécessaires.",
        dependencies: ["backend", "database"],
        priority: "high",
        completed: false
      },
      {
        id: "testing",
        title: "Tests",
        description: "Ajouter tests unitaires, intégration et vérifications de régression.",
        dependencies: ["backend", "frontend"],
        priority: "high",
        completed: false
      },
      {
        id: "security",
        title: "Audit sécurité",
        description: "Vérifier validation, permissions, secrets, headers et erreurs.",
        dependencies: ["backend", "authentication"],
        priority: "high",
        completed: false
      },
      {
        id: "deployment",
        title: "Déploiement",
        description: "Préparer Docker, variables d'environnement, health checks et documentation.",
        dependencies: ["testing", "security"],
        priority: "medium",
        completed: false
      }
    ];

    if (/mobile|android|apk|flutter|react native|ios/i.test(objective)) {
      tasks.splice(4, 0, {
        id: "mobile",
        title: "Application mobile",
        description: "Préparer l'application mobile, navigation, API, stockage local et configuration de build.",
        dependencies: ["backend"],
        priority: "high",
        completed: false
      });
    }

    return {
      objective,
      architecture: reasoning.architecture,
      tasks,
      stack: reasoning.recommendedStack
    };
  }
}

export const taskPlanner = new TaskPlanner();
