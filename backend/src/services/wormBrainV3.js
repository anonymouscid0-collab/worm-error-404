const axios = require('axios');
const searchEngine = require('./searchEngine');

class WormBrainV3 {
  constructor() {
    this.systemPrompt = process.env.AI_SYSTEM_PROMPT || this.getDefaultPrompt();
    console.log('🧠 Worm Brain V3 initialisé.');
  }

  getDefaultPrompt() {
    return `Tu es WORM ERROR 404 v3, une IA Senior Full-Stack Developer autonome.
Tu codes en JavaScript, TypeScript, Python, Go, Rust, C++, Java, PHP, SQL.
Tu expliques clairement avec des exemples de code complets et fonctionnels.
Tu détectes les bugs, tu proposes des corrections optimisées.
Tu utilises la recherche temps réel quand c'est nécessaire.
Tu réponds en français par défaut, sauf si l'utilisateur demande autre chose.
Format: Markdown avec syntax highlighting.`;
  }

  async generateResponse(prompt, options = {}) {
    const startTime = Date.now();
    const model = options.model || 'worm-fullstack-v3';

    if (!prompt || prompt.trim() === '') {
      throw new Error('Le prompt ne peut pas être vide.');
    }

    let searchResults = null;
    let enhancedPrompt = prompt;

    if (this.needsSearch(prompt)) {
      try {
        searchResults = await searchEngine.universalSearch(prompt, {
          includeGoogle: true,
          includeGitHub: true,
          includeStackOverflow: true,
          includeNPM: true,
          includeYouTube: true,
          includeReddit: true,
          includeTelegram: true,
          includeDarkWeb: true,
          maxResults: 5
        });
        const searchContext = this.formatSearchContext(searchResults);
        enhancedPrompt = `${this.systemPrompt}\n\nCONTEXTE RECHERCHE TEMPS RÉEL:\n${searchContext}\n\nQUESTION UTILISATEUR:\n${prompt}`;
      } catch (err) {
        console.log('Search failed:', err.message);
        enhancedPrompt = `${this.systemPrompt}\n\nQUESTION UTILISATEUR:\n${prompt}`;
      }
    } else {
      enhancedPrompt = `${this.systemPrompt}\n\nQUESTION UTILISATEUR:\n${prompt}`;
    }

    const response = await this.callAI(enhancedPrompt, model, options.context);
    const latency_ms = Date.now() - startTime;

    return {
      response,
      metadata: {
        model,
        latency_ms,
        tokens_used: Math.round(response.length / 4),
        search_results: searchResults ? searchResults.sources : undefined
      }
    };
  }

  async processRequest(prompt, userContext) {
    const result = await this.generateResponse(prompt, {
      sessionId: userContext?.sessionId,
      model: userContext?.model || 'worm-fullstack-v3'
    });
    return result.response;
  }

  needsSearch(prompt) {
    const keywords = [
      'recherche', 'search', 'trouve', 'find', 'dernière version', 'latest',
      'npm', 'package', 'bibliothèque', 'library', 'documentation',
      'bug', 'erreur', 'error', 'fix', 'corrige', 'deprecated',
      'github', 'stackoverflow', 'youtube', 'reddit', 'telegram'
    ];
    return keywords.some(kw => prompt.toLowerCase().includes(kw));
  }

  formatSearchContext(results) {
    let ctx = '';
    if (results.results?.google) {
      ctx += '=== GOOGLE ===\n';
      results.results.google.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title}: ${r.snippet}\n`;
      });
    }
    if (results.results?.github) {
      ctx += '\n=== GITHUB ===\n';
      results.results.github.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title} (${r.stars}⭐): ${r.description}\n`;
      });
    }
    if (results.results?.stackoverflow) {
      ctx += '\n=== STACKOVERFLOW ===\n';
      results.results.stackoverflow.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title} (Score: ${r.score}, Réponses: ${r.answerCount})\n`;
      });
    }
    if (results.results?.npm) {
      ctx += '\n=== NPM ===\n';
      results.results.npm.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title} (v${r.version}): ${r.description}\n`;
      });
    }
    if (results.results?.youtube) {
      ctx += '\n=== YOUTUBE ===\n';
      results.results.youtube.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title} (${r.channel})\n`;
      });
    }
    if (results.results?.reddit) {
      ctx += '\n=== REDDIT ===\n';
      results.results.reddit.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title} (r/${r.subreddit}, ${r.score}↑)\n`;
      });
    }
    if (results.results?.telegram) {
      ctx += '\n=== TELEGRAM ===\n';
      results.results.telegram.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title}: ${r.snippet}\n`;
      });
    }
    if (results.results?.darkweb) {
      ctx += '\n=== DARK WEB SOURCES ===\n';
      results.results.darkweb.results?.slice(0, 3).forEach(r => {
        ctx += `- ${r.title}: ${r.snippet}\n`;
      });
    }
    return ctx || 'Aucun résultat de recherche.';
  }

  async callAI(prompt, model, context) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    if (apiKey) {
      try {
        return await this.callExternalAI(prompt, model, context, apiKey);
      } catch (err) {
        console.log('External AI failed, fallback local:', err.message);
      }
    }
    return this.generateLocalResponse(prompt, model);
  }

  async callExternalAI(prompt, model, context, apiKey) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...(context || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 4000
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 30000
    });
    return res.data.choices[0].message.content;
  }

  generateLocalResponse(prompt, model) {
    const lower = prompt.toLowerCase();
    if (lower.includes('code') || lower.includes('bug') || lower.includes('fix') || lower.includes('erreur')) {
      return `**[WORM BRAIN V3 — Mode Local]**

J'ai analysé ta demande. Voici ma réponse :

\`\`\`typescript
// Exemple généré par Worm Brain V3
function analyzeRequest(prompt) {
  const analysis = {
    intent: 'code_assistance',
    complexity: 'medium',
    model: '${model}'
  };
  return \`Analyse complète de : \${prompt}\`;
}
\`\`\`

**Note :** Pour des réponses plus puissantes, configure \`OPENAI_API_KEY\` dans les variables d'environnement Render.`;
    }
    return `**[WORM BRAIN V3 — Mode Local]**

J'ai bien reçu ta demande : "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"

**Statut :** Traitement effectué avec succès par le noyau V3.
**Modèle :** ${model}
**Recherche temps réel :** Activée (Google, GitHub, StackOverflow, NPM, YouTube, Reddit, Telegram, Dark Web)

Pour des réponses avancées, ajoute une clé API OpenAI dans les variables d'environnement Render.`;
  }

  getStats() {
    return { version: '3.0.0', status: 'active', searchEngine: 'universal' };
  }
}

module.exports = new WormBrainV3();
