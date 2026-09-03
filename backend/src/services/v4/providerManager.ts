export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  enabled: boolean;
}

export interface ProviderRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderResponse {
  provider: string;
  model: string;
  content: string;
  latencyMs: number;
}

export class ProviderManager {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    if (!provider.id.trim()) {
      throw new Error("Provider id cannot be empty.");
    }

    this.providers.set(provider.id, {
      ...provider,
      baseUrl: provider.baseUrl.replace(/\/+$/, ""),
    });
  }

  remove(id: string): boolean {
    return this.providers.delete(id);
  }

  get(id: string): AIProvider | null {
    return this.providers.get(id) ?? null;
  }

  list(): AIProvider[] {
    return [...this.providers.values()].map(({ apiKey, ...provider }) => provider);
  }

  enable(id: string): boolean {
    const provider = this.providers.get(id);
    if (!provider) return false;

    provider.enabled = true;
    return true;
  }

  disable(id: string): boolean {
    const provider = this.providers.get(id);
    if (!provider) return false;

    provider.enabled = false;
    return true;
  }

  getAvailable(): AIProvider[] {
    return [...this.providers.values()].filter(
      (provider) => provider.enabled && Boolean(provider.apiKey),
    );
  }

  getPreferred(): AIProvider | null {
    return this.getAvailable()[0] ?? null;
  }

  has(id: string): boolean {
    return this.providers.has(id);
  }

  count(): number {
    return this.providers.size;
  }
}

export const providerManager = new ProviderManager();
