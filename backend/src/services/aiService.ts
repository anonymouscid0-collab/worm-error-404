import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { searchWeb, formatSearchResults } from "./searchEngine";

export interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiAttachmentInput {
  fileName: string;
  fileType: string;
  fileUrl: string;
}

export interface AiResponse {
  content: string;
  isDownloadable?: boolean;
  downloadFileName?: string;
}

interface AiConfig {
  apiKey: string;
  apiUrl: string;
  systemPrompt: string;
}

export async function getAiConfig(): Promise<AiConfig> {
  const [activeKey, promptSetting, urlSetting] = await Promise.all([
    prisma.apiKey.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.siteSetting.findUnique({ where: { key: "ai_system_prompt" } }),
    prisma.siteSetting.findUnique({ where: { key: "ai_api_url" } }),
  ]);

  return {
    apiKey: activeKey?.keyValue || env.aiApiKey,
    apiUrl: urlSetting?.value || env.aiApiUrl,
    systemPrompt: promptSetting?.value || env.aiSystemPrompt,
  };
}

function needsSearch(content: string): boolean {
  const lower = content.toLowerCase();
  return /derniere|latest|actualite|news|npm|package|bibliotheque|doc|bug|cve|github|stackoverflow|youtube|202[4-9]|aujourd|today|recent/.test(lower);
}

export async function generateAiResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[] = []
): Promise<AiResponse> {
  const config = await getAiConfig();
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const text = (lastUserMessage?.content ?? "").trim();

  // Recherche web si besoin
  let searchContext = "";
  if (needsSearch(text)) {
    const results = await searchWeb(text, 3);
    if (results.length > 0) {
      searchContext = formatSearchResults(results);
    }
  }

  if (!config.apiKey || !config.apiUrl) {
    return stubResponse(history, attachments, searchContext);
  }

  return callAiProvider(history, attachments, config, searchContext);
}

function stubResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[],
  searchContext: string = ""
): AiResponse {
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const text = (lastUserMessage?.content ?? "").trim();

  const attachmentLine =
    attachments.length > 0
      ? `\n\n📎 J'ai bien reçu ${attachments.length === 1 ? "ton fichier" : `tes ${attachments.length} fichiers`}.`
      : "";

  const searchLine = searchContext
    ? `\n\n🔍 ${searchContext}`
    : "";

  return {
    content:
      `Je vois ce que tu me demandes : « ${text} ». ` +
      `Pour l'instant je réponds en mode démo (aucun modèle d'IA externe n'est branché). ` +
      `Va dans le panneau Admin → IA pour configurer ta clé API.` +
      attachmentLine +
      searchLine +
      `\n\nUne fois configuré, je répondrai avec des projets complets, du code fonctionnel et des explications détaillées.`,
  };
}

async function callAiProvider(
  history: AiChatMessage[],
  _attachments: AiAttachmentInput[],
  config: AiConfig,
  searchContext: string = ""
): Promise<AiResponse> {
  let systemContent = config.systemPrompt || "Tu es WORM ERROR 404, un développeur Full Stack Senior.";
  
  if (searchContext) {
    systemContent += `\n\nUtilise ces résultats de recherche web récents pour enrichir ta réponse :\n${searchContext}`;
  }

  const messages: AiChatMessage[] = systemContent
    ? [{ role: "system", content: systemContent }, ...history]
    : history;

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ 
        model: env.aiModel || "gpt-4o-mini",
        messages,
        temperature: 0.8,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        content: `Erreur de l'API IA (${response.status}) : ${errorText.slice(0, 300) || "réponse invalide"}`,
      };
    }

    const data: any = await response.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.content ??
      JSON.stringify(data);

    return { content };
  } catch (err) {
    return {
      content: `Impossible de contacter l'API IA : ${(err as Error).message}`,
    };
  }
}
