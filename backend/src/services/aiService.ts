import { env } from "../config/env";
import { prisma } from "../config/prisma";

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

export async function generateAiResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[] = []
): Promise<AiResponse> {
  const config = await getAiConfig();

  if (!config.apiKey || !config.apiUrl) {
    return stubResponse(history, attachments);
  }

  return callAiProvider(history, attachments, config);
}

function stubResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[]
): AiResponse {
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const text = (lastUserMessage?.content ?? "").trim();

  const attachmentLine =
    attachments.length > 0
      ? `\n\nJ'ai bien reçu ${attachments.length === 1 ? "ton fichier" : `tes ${attachments.length} fichiers`} - une fois l'IA branchée, je pourrai les analyser directement.`
      : "";

  return {
    content:
      `Je vois ce que tu me demandes : « ${text} ». ` +
      `Pour l'instant je réponds encore en mode démo (aucun modèle d'IA n'est branché sur ce compte), ` +
      `donc je ne peux pas encore te générer le vrai code ou la vraie correction. Une fois CID aura ajouté la clé API et le prompt système, ` +
      `je répondrai avec des projets complets, du code fonctionnel et des explications détaillées, comme un vrai développeur senior le ferait.` +
      attachmentLine,
  };
}

async function callAiProvider(
  history: AiChatMessage[],
  _attachments: AiAttachmentInput[],
  config: AiConfig
): Promise<AiResponse> {
  const messages: AiChatMessage[] = config.systemPrompt
    ? [{ role: "system", content: config.systemPrompt }, ...history]
    : history;

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ messages }),
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
