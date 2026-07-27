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
  /** Set true if the response should be offered as a downloadable file to the user. */
  isDownloadable?: boolean;
  downloadFileName?: string;
}

/**
 * ============================================================================
 *  POINT D'INTÉGRATION UNIQUE DE L'IA
 * ============================================================================
 * C'est le SEUL fichier à modifier quand tu ajoutes :
 *   - ta clé API IA          → env.aiApiKey (variable AI_API_KEY dans .env)
 *   - ton prompt système     → env.aiSystemPrompt (variable AI_SYSTEM_PROMPT)
 *   - ton endpoint IA        → env.aiApiUrl (variable AI_API_URL)
 *   - tes outils de recherche temps réel → à brancher dans callAiProvider()
 *
 * Tant que ces variables ne sont pas renseignées, cette fonction répond avec
 * une réponse de démonstration (stub) pour que le reste de la plateforme
 * (limite de messages, historique, upload de fichiers, Premium) reste
 * testable de bout en bout.
 * ============================================================================
 */
export async function generateAiResponse(
  history: AiChatMessage[],
  attachments: AiAttachmentInput[] = []
): Promise<AiResponse> {
  if (!env.aiApiKey || !env.aiApiUrl) {
    return stubResponse(history, attachments);
  }

  return callAiProvider(history, attachments);
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
      `Pour l'instant je réponds encore en mode démo (aucun modèle d'IA n'est branché sur ce compte), ` +
      `donc je ne peux pas encore te générer le vrai code ou la vraie correction — mais dès que CID aura ajouté la clé API et le prompt système, ` +
      `je répondrai avec des projets complets, du code fonctionnel et des explications détaillées, comme un vrai développeur senior le ferait.` +
      attachmentLine,
  };
}

/**
 * Remplace le corps de cette fonction par l'appel réel à ton fournisseur d'IA
 * (ex: Anthropic, OpenAI, ou un modèle auto-hébergé) une fois que tu as les
 * identifiants. Le système de prompt (env.aiSystemPrompt) doit être injecté
 * comme message "system" en tête de la conversation.
 */
async function callAiProvider(
  history: AiChatMessage[],
  _attachments: AiAttachmentInput[]
): Promise<AiResponse> {
  const messages: AiChatMessage[] = env.aiSystemPrompt
    ? [{ role: "system", content: env.aiSystemPrompt }, ...history]
    : history;

  // --- Exemple d'intégration (à décommenter et adapter) ---
  // const response = await fetch(env.aiApiUrl, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${env.aiApiKey}`,
  //   },
  //   body: JSON.stringify({ messages }),
  // });
  // const data = await response.json();
  // return { content: data.content };

  void messages;
  return stubResponse(history, _attachments);
}
