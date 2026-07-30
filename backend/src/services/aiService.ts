import { env } from "../config/env";
import * as https from "https";

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

// 8 clés fallback - si l'une échoue, on passe à la suivante automatiquement
const API_KEYS = [
  { key: "dgpt_live_8c2e687a490b6e919880dca53861043c903eb55b8f1f1652", model: "claude-4.6-sonnet" },
  { key: "dgpt_live_f7f247f1d77eb15c135bb94280b8fa3cc3337a4d0685a465", model: "claude-4.5-sonnet" },
  { key: "dgpt_live_69945758830f51507125fab57da3bd998101f465d383ca24", model: "ministral-14b" },
  { key: "dgpt_live_e1bb34c09d9adbea0f8dc4fb3d29a91dc3c05df88a4687a5", model: "deepseek-v4-flash" },
  { key: "dgpt_live_099a9f438b2722932d040af6cf651a268744e23f25389c9b", model: "qwen-3-235b" },
  { key: "dgpt_live_7ffc4e077ebfef442a308237e1a6b5b5852ff16666ef1ee3", model: "grok-4.1-fast" },
  { key: "dgpt_live_0c11371555c59125118a460e67d081b1e24ac17f0c88cfdb", model: "minimax-m3" },
  { key: "dgpt_live_5bf100ca120acdf1ad913d3b91866f74e532323d1f0478f8", model: "deepseek-v4-pro" },
];

export async function generateAiResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[] = []
): Promise<AiResponse> {
  let lastError = "";
  
  // Essaie chaque clé jusqu'à ce que l'une fonctionne
  for (const apiKey of API_KEYS) {
    try {
      return await callDarkGpt(history, attachments, apiKey.key, apiKey.model);
    } catch (err: any) {
      lastError = err.message || String(err);
      console.error(`[IA Fallback] ${apiKey.model} failed:`, lastError);
      continue; // Passe à la clé suivante
    }
  }
  
  // Si toutes les clés échouent
  console.error("[IA Fallback] Toutes les clés ont échoué");
  return stubResponse(history, attachments);
}

function stubResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[]
): AiResponse {
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const text = (lastUserMessage?.content ?? "").trim();
  const attachmentLine =
    attachments.length > 0
      ? `\\n\\nJ'ai bien reçu ${attachments.length === 1 ? "ton fichier" : `tes ${attachments.length} fichiers`}.`
      : "";
  return {
    content:
      `Je vois ce que tu me demandes : « ${text} ». ` +
      `Pour l'instant je réponds en mode démo (les clés API sont temporairement indisponibles), ` +
      `mais dès que la connexion sera rétablie, je répondrai avec du code fonctionnel et des explications détaillées.` +
      attachmentLine,
  };
}

function httpRequest(
  url: string,
  options: https.RequestOptions,
  postData?: string
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { resolve({ statusCode: res.statusCode || 0, body: data }); });
    });
    req.on("error", (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function callDarkGpt(
  history: AiChatMessage[],
  _attachments: AiAttachmentInput[],
  apiKey: string,
  model: string
): Promise<AiResponse> {
  const url = "https://darkgpt.chat/v1/chat/completions";
  
  const messages = env.aiSystemPrompt
    ? [{ role: "system", content: env.aiSystemPrompt }, ...history]
    : history;

  const postData = JSON.stringify({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const { statusCode, body } = await httpRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Content-Length": Buffer.byteLength(postData),
    },
  }, postData);

  if (statusCode !== 200) {
    throw new Error(`API ${statusCode}: ${body.slice(0, 200)}`);
  }

  const data = JSON.parse(body);
  const text = data.choices?.[0]?.message?.content ?? "Pas de réponse.";
  return { content: text };
}
