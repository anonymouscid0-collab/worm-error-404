import { codeAnalyzer, aiReview, CodeIssue } from "./codeAnalyzer";
import { callWithFallback, ProviderKey } from "./providerManager";

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

export interface VerificationOutcome {
  content: string;
  issuesFound: number;
  issuesFixed: boolean;
}

export async function verifyAndFixResponse(
  content: string,
  providers: ProviderKey[]
): Promise<VerificationOutcome> {
  const blocks = extractCodeBlocks(content);
  if (blocks.length === 0) {
    return { content, issuesFound: 0, issuesFixed: false };
  }

  const allIssues: { block: number; lang: string; issue: CodeIssue }[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const analysis = codeAnalyzer.analyze(b.code, b.lang);
    analysis.issues
      .filter((issue) => issue.severity === "error")
      .forEach((issue) => allIssues.push({ block: i + 1, lang: b.lang, issue }));

    if (providers.length > 0) {
      const reviewIssues = await aiReview(b.code, b.lang, providers);
      reviewIssues
        .filter((issue) => issue.severity === "error" || issue.severity === "warning")
        .forEach((issue) => allIssues.push({ block: i + 1, lang: b.lang, issue }));
    }
  }

  if (allIssues.length === 0) {
    return { content, issuesFound: 0, issuesFixed: false };
  }

  const issuesReport = allIssues
    .map((i) => `- Bloc ${i.block} (${i.lang})${i.issue.line ? `, ligne ${i.issue.line}` : ""} : ${i.issue.message} → ${i.issue.suggestion ?? ""}`)
    .join("\n");

  try {
    const result = await callWithFallback(
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
      providers,
      { maxTokens: 4000, temperature: 0.3 }
    );

    if (!result.ok || !result.content?.trim()) {
      return { content, issuesFound: allIssues.length, issuesFixed: false };
    }

    const fixed = result.content;

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
