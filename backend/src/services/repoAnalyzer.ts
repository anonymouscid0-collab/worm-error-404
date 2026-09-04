export interface RepoFile {
  path: string;
  content: string;
}

export interface RepoAnalysisResult {
  ok: boolean;
  owner?: string;
  repo?: string;
  branch?: string;
  files?: RepoFile[];
  fileCount?: number;
  truncated?: boolean;
  error?: string;
}

const MAX_FILES = 60;
const MAX_TOTAL_CHARS = 300_000;
const MAX_FILE_CHARS = 8_000;

const TEXT_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "json", "md", "py", "java", "go", "rs",
  "c", "cpp", "h", "hpp", "cs", "php", "rb", "yml", "yaml", "toml",
  "prisma", "css", "html", "sql", "kt", "swift", "dart",
]);

function extractGithubRepo(text: string): { owner: string; repo: string } | null {
  const match = text.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[\/\s)]|$)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function githubFetch(url: string) {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { "User-Agent": "worm-error-404" };
  if (token) headers["Authorization"] = `token ${token}`;
  return fetch(url, { headers });
}

export async function analyzeGithubRepo(text: string): Promise<RepoAnalysisResult> {
  const parsed = extractGithubRepo(text);
  if (!parsed) return { ok: false, error: "Aucun lien GitHub détecté dans le message." };

  const { owner, repo } = parsed;

  const repoInfoRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoInfoRes.ok) {
    return {
      ok: false,
      error: repoInfoRes.status === 404
        ? "Dépôt introuvable ou privé (l'analyse ne fonctionne que sur les dépôts publics)."
        : `Erreur GitHub (${repoInfoRes.status}), probablement une limite de requêtes atteinte.`,
    };
  }
  const repoInfo: any = await repoInfoRes.json();
  const branch = repoInfo.default_branch || "main";

  const treeRes = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
  if (!treeRes.ok) {
    return { ok: false, error: `Impossible de lire l'arborescence du dépôt (${treeRes.status}).` };
  }
  const treeData: any = await treeRes.json();

  const allFiles: { path: string; size: number }[] = (treeData.tree || [])
    .filter((n: any) => n.type === "blob")
    .map((n: any) => ({ path: n.path, size: n.size || 0 }));

  const relevant = allFiles
    .filter((f) => {
      const lower = f.path.toLowerCase();
      if (
        lower.includes("node_modules/") ||
        lower.includes(".git/") ||
        lower.includes("dist/") ||
        lower.includes("build/") ||
        lower.includes(".next/") ||
        lower.includes("package-lock.json") ||
        lower.includes("yarn.lock")
      ) {
        return false;
      }
      const ext = f.path.split(".").pop()?.toLowerCase() || "";
      return TEXT_EXTENSIONS.has(ext) || lower.endsWith("dockerfile") || lower === "readme.md";
    })
    .sort((a, b) => a.size - b.size)
    .slice(0, MAX_FILES);

  const files: RepoFile[] = [];
  let totalChars = 0;
  let truncated = allFiles.length > relevant.length;

  for (const f of relevant) {
    if (totalChars >= MAX_TOTAL_CHARS) {
      truncated = true;
      break;
    }
    try {
      const rawRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${f.path}`
      );
      if (!rawRes.ok) continue;
      const content = (await rawRes.text()).slice(0, MAX_FILE_CHARS);
      files.push({ path: f.path, content });
      totalChars += content.length;
    } catch {
      continue;
    }
  }

  return { ok: true, owner, repo, branch, files, fileCount: allFiles.length, truncated };
}
