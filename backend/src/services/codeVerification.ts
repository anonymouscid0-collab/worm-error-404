import { codeAnalyzer, CodeIssue } from "./codeAnalyzer";

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ModelConfig {
  apiKey: string;
  apiUrl: string;
}

interface CodeBlock {
  lang: string;
  code: string;
}

function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ lang: (match[1] || "text").toLowerCase(), code: match[2] });
  }
  return blocks;
}

async function callModelRaw(messages: Msg[], config: ModelConfig, model: string): Promise<string> {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": "https://worm-error-404.onrender.com",
      "X-Title": "WORM ERROR 404 - Auto-vérification",
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 4000 }),
  });
  if (!response.ok) throw new Error(`Erreur API (${response.status})`);
  const data: any = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export interface VerificationOutcome {
  content: string;
  issuesFound: number;
  issuesFixed: boolean;
}

export async function verifyAndFixResponse(
  content: string,
  config: ModelConfig,
  model: string
): Promise<VerificationOutcome> {
  const blocks = extractCodeBlocks(content);
  if (blocks.length === 0) {
    return { content, issuesFound: 0, issuesFixed: false };
  }

  const allIssues: { block: number; lang: string; issue: CodeIssue }[] = [];
  blocks.forEach((b, i) => {
    const analysis = codeAnalyzer.analyze(b.code, b.lang);
    analysis.issues
      .filter((issue) => issue.severity === "error")
      .forEach((issue) => allIssues.push({ block: i + 1, lang: b.lang, issue }));
  });

  if (allIssues.length === 0) {
    return { content, issuesFound: 0, issuesFixed: false };
  }

  const issuesReport = allIssues
    .map((i) => `- Bloc ${i.block} (${i.lang})${i.issue.line ? `, ligne ${i.issue.line}` : ""} : ${i.issue.message} → ${i.issue.suggestion ?? ""}`)
    .join("\n");

  try {
    const fixed = await callModelRaw(
      [
        {
          role: "system",
          content:
            "Une vérification automatique a détecté des problèmes réels dans la réponse que tu viens de donner. " +
            "Corrige uniquement ces problèmes et renvoie la réponse complète corrigée, dans le même format " +
            "(mêmes blocs de code), sans commentaire méta sur la correction elle-même.",
        },
        { role: "assistant", content },
        {
          role: "user",
          content: `Problèmes détectés par l'analyse automatique :\n${issuesReport}\n\nRenvoie la version corrigée complète.`,
        },
      ],
      config,
      model
    );

    if (!fixed.trim()) {
      return { content, issuesFound: allIssues.length, issuesFixed: false };
    }

    const fixedBlocks = extractCodeBlocks(fixed);
    const stillHasErrors = fixedBlocks.some((b) =>
      codeAnalyzer.analyze(b.code, b.lang).issues.some((i) => i.severity === "error")
    );

    return {
      content: fixed,
      issuesFound: allIssues.length,
      issuesFixed: !stillHasErrors,
    };
  } catch (err) {
    console.error("verifyAndFixResponse error:", err);
    return { content, issuesFound: allIssues.length, issuesFixed: false };
  }
}
