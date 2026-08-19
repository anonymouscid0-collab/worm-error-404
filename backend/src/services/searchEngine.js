/**
 * 🔍 WORM ERROR 404 - MOTEUR DE RECHERCHE UNIVERSEL v3
 * Recherche temps reel sur Google, GitHub, StackOverflow, NPM, YouTube, Reddit, Telegram, Dark Web sources
 */

const axios = require('axios');
const cheerio = require('cheerio');

class SearchEngine {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  getRandomUA() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async universalSearch(query, options = {}) {
    const {
      includeGoogle = true,
      includeGitHub = false,
      includeStackOverflow = false,
      includeNPM = false,
      includeYouTube = false,
      includeReddit = false,
      includeTelegram = false,
      includeDarkWeb = false,
      maxResults = 10
    } = options;

    const results = {};
    const sources = [];
    let totalResults = 0;

    const promises = [];

    if (includeGoogle) {
      promises.push(this.searchGoogle(query, maxResults).then(r => { if (r) { results.google = r; sources.push('Google'); totalResults += r.results?.length || 0; } }));
    }
    if (includeGitHub) {
      promises.push(this.searchGitHub(query, maxResults).then(r => { if (r) { results.github = r; sources.push('GitHub'); totalResults += r.results?.length || 0; } }));
    }
    if (includeStackOverflow) {
      promises.push(this.searchStackOverflow(query, maxResults).then(r => { if (r) { results.stackoverflow = r; sources.push('StackOverflow'); totalResults += r.results?.length || 0; } }));
    }
    if (includeNPM) {
      promises.push(this.searchNPM(query, maxResults).then(r => { if (r) { results.npm = r; sources.push('NPM'); totalResults += r.results?.length || 0; } }));
    }
    if (includeYouTube) {
      promises.push(this.searchYouTube(query, maxResults).then(r => { if (r) { results.youtube = r; sources.push('YouTube'); totalResults += r.results?.length || 0; } }));
    }
    if (includeReddit) {
      promises.push(this.searchReddit(query, maxResults).then(r => { if (r) { results.reddit = r; sources.push('Reddit'); totalResults += r.results?.length || 0; } }));
    }
    if (includeTelegram) {
      promises.push(this.searchTelegram(query, maxResults).then(r => { if (r) { results.telegram = r; sources.push('Telegram'); totalResults += r.results?.length || 0; } }));
    }
    if (includeDarkWeb) {
      promises.push(this.searchDarkWebSources(query, maxResults).then(r => { if (r) { results.darkweb = r; sources.push('DarkWeb'); totalResults += r.results?.length || 0; } }));
    }

    await Promise.allSettled(promises);

    return {
      query,
      totalResults,
      sources,
      results,
      timestamp: new Date().toISOString()
    };
  }

  async searchGoogle(query, maxResults = 10) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': this.getRandomUA() },
        timeout: 15000
      });
      const $ = cheerio.load(response.data);
      const results = [];

      $('div.g, div[data-ved]').each((i, el) => {
        if (i >= maxResults) return;
        const title = $(el).find('h3').text().trim();
        const link = $(el).find('a').attr('href');
        const snippet = $(el).find('div.VwiC3b, span.aCOpRe').text().trim();
        if (title && link) {
          results.push({ title, url: link, snippet, source: 'Google' });
        }
      });

      return { results, total: results.length };
    } catch (e) {
      console.error('Google search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }

  async searchGitHub(query, maxResults = 10) {
    try {
      const token = process.env.GITHUB_TOKEN;
      const headers = { 'User-Agent': this.getRandomUA() };
      if (token) headers['Authorization'] = `token ${token}`;

      const response = await axios.get(`https://api.github.com/search/repositories`, {
        params: { q: query, sort: 'stars', order: 'desc', per_page: maxResults },
        headers,
        timeout: 15000
      });

      const results = response.data.items?.map(repo => ({
        title: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
        source: 'GitHub'
      })) || [];

      return { results, total: response.data.total_count || 0 };
    } catch (e) {
      console.error('GitHub search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }

  async searchStackOverflow(query, maxResults = 10) {
    try {
      const response = await axios.get(`https://api.stackexchange.com/2.3/search/advanced`, {
        params: {
          order: 'desc',
          sort: 'relevance',
          q: query,
          site: 'stackoverflow',
          pagesize: maxResults
        },
        headers: { 'User-Agent': this.getRandomUA() },
        timeout: 15000
      });

      const results = response.data.items?.map(item => ({
        title: item.title,
        url: item.link,
        score: item.score,
        answerCount: item.answer_count,
        isAnswered: item.is_answered,
        source: 'StackOverflow'
      })) || [];

      return { results, total: response.data.total || 0 };
    } catch (e) {
      console.error('StackOverflow search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }

  async searchNPM(query, maxResults = 10) {
    try {
      const response = await axios.get(`https://registry.npmjs.org/-/v1/search`, {
        params: { text: query, size: maxResults },
        headers: { 'User-Agent': this.getRandomUA() },
        timeout: 15000
      });

      const results = response.data.objects?.map(obj => ({
        title: obj.package.name,
        url: `https://www.npmjs.com/package/${obj.package.name}`,
        description: obj.package.description,
        version: obj.package.version,
        score: obj.score?.final,
        source: 'NPM'
      })) || [];

      return { results, total: response.data.total || 0 };
    } catch (e) {
      console.error('NPM search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }

  async searchYouTube(query, maxResults = 10) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return { results: [], total: 0, error: 'YouTube API key not configured' };
      }
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: 'snippet',
          q: query,
          maxResults: maxResults,
          type: 'video',
          key: apiKey
        },
        timeout: 15000
      });

      const results = response.data.items?.map(item => ({
        title: item.snippet.title,
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description,
        channel: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        source: 'YouTube'
      })) || [];

      return { results, total: response.data.pageInfo?.totalResults || 0 };
    } catch (e) {
      console.error('YouTube search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }

  async searchReddit(query, maxResults = 10) {
    try {
      const response = await axios.get(`https://www.reddit.com/search.json`, {
        params: { q: query, limit: maxResults, sort: 'relevance' },
        headers: { 'User-Agent': 'WormError404/3.0' },
        timeout: 15000
      });

      const results = response.data.data?.children?.map(child => ({
        title: child.data.title,
        url: `https://reddit.com${child.data.permalink}`,
        subreddit: child.data.subreddit,
        score: child.data.score,
        comments: child.data.num_comments,
        source: 'Reddit'
      })) || [];

      return { results, total: results.length };
    } catch (e) {
      console.error('Reddit search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }

  async searchTelegram(query, maxResults = 10) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return { results: [], total: 0, error: 'Telegram bot token not configured' };
      }
      const response = await axios.get(`https://tgstat.ru/search`, {
        params: { q: query },
        headers: { 'User-Agent': this.getRandomUA() },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.post-item, .channel-item').each((i, el) => {
        if (i >= maxResults) return;
        const title = $(el).find('.post-title, .channel-title').text().trim();
        const link = $(el).find('a').attr('href');
        const snippet = $(el).find('.post-text, .channel-description').text().trim();
        if (title) {
          results.push({ title, url: link || '', snippet, source: 'Telegram' });
        }
      });

      return { results, total: results.length };
    } catch (e) {
      console.error('Telegram search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }

  async searchDarkWebSources(query, maxResults = 10) {
    try {
      const sources = [
        { url: `https://psbdmp.ws/api/v3/search/${encodeURIComponent(query)}`, name: 'PasteBin Dumps' },
      ];

      const results = [];

      for (const source of sources) {
        try {
          const response = await axios.get(source.url, {
            headers: { 'User-Agent': this.getRandomUA() },
            timeout: 10000
          });
          if (response.data && response.data.data) {
            response.data.data.slice(0, maxResults).forEach(item => {
              results.push({
                title: item.title || 'Dark Web Result',
                url: item.url || source.url,
                snippet: item.text?.substring(0, 200) || '',
                source: source.name
              });
            });
          }
        } catch (err) {
          // Silently skip failed sources
        }
      }

      return { results, total: results.length };
    } catch (e) {
      console.error('Dark web search error:', e.message);
      return { results: [], total: 0, error: e.message };
    }
  }
}

module.exports = new SearchEngine();
