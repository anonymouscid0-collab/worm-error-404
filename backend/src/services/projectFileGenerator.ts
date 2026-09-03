import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { AiChatMessage } from "./aiService";

interface GenConfig {
  apiKey: string;
  apiUrl: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ProjectGenerationResult {
  ok: boolean;
  projectName?: string;
  files?: GeneratedFile[];
  zipUrl?: string;
  zipFileName?: string;
  error?: string;
}

const MAX_FILES = 40;
const MAX_TOTAL_CHARS = 400_000;

export async function generateProjectFiles(
  history: AiChatMessage[],
  config: GenConfig,
  reasoning: { recommendedStack: string[] }
): Promise<ProjectGenerationResult> {
  const instruction = `Tu dois générer un projet complet basé sur la demande de l'utilisateur.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown, au format exact :
{"projectName": "nom-du-projet", "files": [{"path": "chemin/relatif/fichier.ext", "content": "contenu complet du fichier"}]}

Contraintes :
- Génère au maximum ${MAX_FILES} fichiers, uniquement les fichiers essentiels et fonctionnels.
- Chaque fichier doit avoir un contenu réel et complet, jamais de "// TODO" à la place du code.
- Stack recommandée si pertinente : ${reasoning.recommendedStack.join(", ") || "au choix selon la demande"}.
- N'inclus pas node_modules ni de fichiers binaires.`;

  const messages: AiChatMessage[] = [
    { role: "system", content: instruction },
    ...history,
  ];

  let response: Response;
  try {
    response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "https://worm-error-404.onrender.com",
        "X-Title": "WORM ERROR 404",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "mistralai/mixtral-8x22b-instruct",
        messages,
        temperature: 0.4,
        max_tokens: 8000,
      }),
    });
  } catch (err) {
    return { ok: false, error: `Impossible de contacter l'API : ${(err as Error).message}` };
  }

  if (!response.ok) {
    return { ok: false, error: `Erreur API (${response.status})` };
  }

  const data: any = await response.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";

  const jsonText = extractJson(raw);
  if (!jsonText) {
    return { ok: false, error: "Réponse du modèle non exploitable (pas de JSON détecté)." };
  }

  let parsed: { projectName?: string; files?: GeneratedFile[] };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "JSON invalide renvoyé par le modèle." };
  }

  if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    return { ok: false, error: "Aucun fichier généré." };
  }

  const files = parsed.files
    .filter((f) => f && typeof f.path === "string" && typeof f.content === "string")
    .slice(0, MAX_FILES);

  const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return { ok: false, error: "Projet généré trop volumineux, reformule une demande plus précise." };
  }

  const projectName = (parsed.projectName || "worm-project")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .slice(0, 60);

  const zip = new JSZip();
  for (const file of files) {
    const safePath = file.path.replace(/^\/+/, "").replace(/\.\.(\/|\\)/g, "");
    zip.file(safePath, file.content);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  const uploadsDir = path.join(process.cwd(), "uploads", "projects");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const zipFileName = `${projectName}-${Date.now()}.zip`;
  fs.writeFileSync(path.join(uploadsDir, zipFileName), zipBuffer);

  return {
    ok: true,
    projectName,
    files,
    zipUrl: `/uploads/projects/${zipFileName}`,
    zipFileName,
  };
}

function extractJson(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}
