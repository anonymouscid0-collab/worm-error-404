export interface ProviderKey {
  provider: string;
  apiKey: string;
  apiUrl?: string;
  model?: string;
}

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CallResult {
  ok: boolean;
  content?: string;
  error?: string;
  provider: string;
}

const PROVIDER_DEFAULTS: Record<string, { apiUrl: string; model: string }> = {
  openrouter: { apiUrl: "https://openrouter.ai/api/v1/chat/completions", model: "openrouter/free" },
  openai: { apiUrl: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
  groq: { apiUrl: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile" },
  anthropic: { apiUrl: "https://api.anthropic.com/v1/messages", model: "claude-3-5-haiku-20241022" },
};

async function callOpenAiCompatible(
  messages: ChatMsg[],
  key: ProviderKey,
  maxTokens: number,
  temperature: number
): Promise<CallResult> {
  const defaults = PROVIDER_DEFAULTS[key.provider] || PROVIDER_DEFAULTS.openrouter;
  const apiUrl = key.apiUrl || defaults.apiUrl;
  const model = key.model || defaults.model;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.apiKey}`,
        "HTTP-Referer": "https://worm-error-404.onrender.com",
        "X-Title": "WORM ERROR 404",
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${text.slice(0, 200)}`, provider: key.provider };
    }

    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: "Réponse vide", provider: key.provider };

    return { ok: true, content, provider: key.provider };
  } catch (err) {
    return { ok: false, error: (err as Error).message, provider: key.provider };
  }
}

async function callAnthropic(
  messages: ChatMsg[],
  key: ProviderKey,
  maxTokens: number,
  temperature: number
): Promise<CallResult> {
  const defaults = PROVIDER_DEFAULTS.anthropic;
  const apiUrl = key.apiUrl || defaults.apiUrl;
  const model = key.model || defaults.model;

  const systemMsg = messages.find((m) => m.role === "system")?.content;
  const convMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, system: systemMsg, messages: convMsgs, max_tokens: maxTokens, temperature }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${text.slice(0, 200)}`, provider: "anthropic" };
    }

    const data: any = await res.json();
    const content = data?.content?.[0]?.text;
    if (!content) return { ok: false, error: "Réponse vide", provider: "anthropic" };

    return { ok: true, content, provider: "anthropic" };
  } catch (err) {
    return { ok: false, error: (err as Error).message, provider: "anthropic" };
  }
}

export async function callProvider(
  messages: ChatMsg[],
  key: ProviderKey,
  opts?: { maxTokens?: number; temperature?: number }
): Promise<CallResult> {
  const maxTokens = opts?.maxTokens ?? 4000;
  const temperature = opts?.temperature ?? 0.7;

  if (key.provider === "anthropic") return callAnthropic(messages, key, maxTokens, temperature);
  return callOpenAiCompatible(messages, key, maxTokens, temperature);
}

export async function callWithFallback(
  messages: ChatMsg[],
  keys: ProviderKey[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<CallResult> {
  let lastError: CallResult | null = null;

  for (const key of keys) {
    const result = await callProvider(messages, key, opts);
    if (result.ok) return result;
    console.error(`Provider ${key.provider} a échoué : ${result.error}`);
    lastError = result;
  }

  return lastError || { ok: false, error: "Aucun fournisseur configuré", provider: "none" };
}
