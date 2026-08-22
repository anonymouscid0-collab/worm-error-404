import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((i, el) => {
      if (i >= maxResults) return;
      const title = $(el).find('.result__title').text().trim();
      const resultUrl = $(el).find('.result__url').text().trim() || $(el).find('.result__a').attr('href') || '';
      const snippet = $(el).find('.result__snippet').text().trim();
      if (title && snippet) {
        results.push({ title, url: resultUrl, snippet });
      }
    });

    return results;
  } catch (err: any) {
    console.error('Search engine error:', err.message);
    return [];
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '';
  return '\n\n--- Résultats de recherche web ---\n' +
    results.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`).join('\n\n') +
    '\n--- Fin recherche ---\n';
}
