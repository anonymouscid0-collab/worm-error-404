import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((i, el) => {
      if (i >= maxResults) return;
      const title = $(el).find('.result__title').text().trim();
      const resultUrl = $(el).find('.result__url').text().trim() || $(el).find('.result__a').attr('href') || '';
      const snippet = $(el).find('.result__snippet').text().trim();
      if (title && snippet) {
        results.push({ title, url: resultUrl, snippet, source: 'Web' });
      }
    });

    return results;
  } catch (err: any) {
    console.error('searchDuckDuckGo error:', err.message);
    return [];
  }
}

async function searchStackOverflow(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=${maxResults}`;
    const response = await axios.get(url, { timeout: 10000 });
    const items = response.data?.items || [];

    return items.slice(0, maxResults).map((item: any): SearchResult => ({
      title: item.title,
      url: item.link,
      snippet: `Score: ${item.score}, réponses: ${item.answer_count}${item.is_answered ? ' (résolu)' : ''}`,
      source: 'StackOverflow',
    }));
  } catch (err: any) {
    console.error('searchStackOverflow error:', err.message);
    return [];
  }
}

async function searchGithubRepos(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = { 'User-Agent': 'worm-error-404' };
    if (token) headers['Authorization'] = `token ${token}`;

    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${maxResults}`;
    const response = await axios.get(url, { headers, timeout: 10000 });
    const items = response.data?.items || [];

    return items.slice(0, maxResults).map((item: any): SearchResult => ({
      title: item.full_name,
      url: item.html_url,
      snippet: `${item.description || 'Pas de description'} (⭐ ${item.stargazers_count})`,
      source: 'GitHub',
    }));
  } catch (err: any) {
    console.error('searchGithubRepos error:', err.message);
    return [];
  }
}

async function searchNpm(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${maxResults}`;
    const response = await axios.get(url, { timeout: 10000 });
    const objects = response.data?.objects || [];

    return objects.slice(0, maxResults).map((o: any): SearchResult => ({
      title: o.package.name + (o.package.version ? ` (v${o.package.version})` : ''),
      url: o.package.links?.npm || `https://www.npmjs.com/package/${o.package.name}`,
      snippet: o.package.description || 'Pas de description',
      source: 'npm',
    }));
  } catch (err: any) {
    console.error('searchNpm error:', err.message);
    return [];
  }
}

function isPackageQuery(query: string): boolean {
  return /npm|package|librairie|bibliotheque|library|module/i.test(query);
}
function isCodeQuery(query: string): boolean {
  return /github|repo|d[ée]p[oô]t|projet|exemple|code source|open.?source/i.test(query);
}
function isErrorQuery(query: string): boolean {
  return /erreur|error|bug|exception|stack ?trace|comment (faire|r[ée]soudre)/i.test(query);
}

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const perSourceLimit = Math.max(2, Math.ceil(maxResults / 2));

  const tasks: Promise<SearchResult[]>[] = [searchDuckDuckGo(query, maxResults)];

  if (isErrorQuery(query)) tasks.push(searchStackOverflow(query, perSourceLimit));
  if (isPackageQuery(query)) tasks.push(searchNpm(query, perSourceLimit));
  if (isCodeQuery(query)) tasks.push(searchGithubRepos(query, perSourceLimit));

  if (tasks.length === 1) tasks.push(searchStackOverflow(query, perSourceLimit));

  const settled = await Promise.allSettled(tasks);
  const merged: SearchResult[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') merged.push(...result.value);
  }

  return merged.slice(0, maxResults * 2);
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '';
  const sources = [...new Set(results.map((r) => r.source))].join(', ');
  return (
    `\n\n--- Résultats de recherche (${sources}) ---\n` +
    results.map((r, i) => `[${i + 1}] (${r.source}) ${r.title}\n${r.snippet}\nSource: ${r.url}`).join('\n\n') +
    '\n--- Fin recherche ---\n'
  );
}
