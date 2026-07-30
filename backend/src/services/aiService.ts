import { env } from "../config/env";

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

export async function generateAiResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[] = []
): Promise<AiResponse> {
  if (!env.aiApiKey) {
    return stubResponse(history, attachments);
  }
  return callDarkGpt(history, attachments);
}

function stubResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[]
): AiResponse {
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const text = (lastUserMessage?.content ?? "").trim();
  const attachmentLine =
    attachments.length > 0
      ? `\n\nJ'ai bien reçu ${attachments.length === 1 ? "ton fichier" : `tes ${attachments.length} fichiers`} — une fois l'IA branchée, je pourrai les analyser directement.`
      : "";
  return {
    content:
      `Je vois ce que tu me demandes : « ${text} ». ` +
      `Pour l'instant je réponds encore en mode démo (aucune clé API n'est configurée), ` +
      `donc je ne peux pas encore te générer le vrai code ou la vraie correction — mais dès que CID aura ajouté la clé API, ` +
      `je répondrai avec des projets complets, du code fonctionnel et des explications détaillées, comme un vrai développeur senior le ferait.` +
      attachmentLine,
  };
}

async function callDarkGpt(
  history: AiChatMessage[],
  _attachments: AiAttachmentInput[]
): Promise<AiResponse> {
  const apiKey = env.aiApiKey;
  const url = env.aiApiUrl || "https://darkgpt.chat/v1/chat/completions";
  const model = env.aiModel || "claude-4.6-sonnet";

  const messages = env.aiSystemPrompt
    ? [{ role: "system", content: env.aiSystemPrompt }, ...history]
    : history;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DarkGPT API error:", errText);
      return { content: `Erreur API DarkGPT: ${response.status}. Vérifie ta clé API.` };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "Pas de réponse de l'IA.";
    return { content: text };
  } catch (err: any) {
    console.error("DarkGPT fetch error:", err);
    return { content: `Erreur de connexion à DarkGPT: ${err.message}` };
  }
}
