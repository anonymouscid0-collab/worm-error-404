"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import CodeBlock from "./CodeBlock";

function renderParts(content: string) {
  const parts = content.split(/```(\w*)\n?([\s\S]*?)```/g);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i += 3) {
    const text = parts[i];
    if (text) {
      nodes.push(
        <p key={`t-${i}`} className="whitespace-pre-wrap">
          {text}
        </p>
      );
    }
    const lang = parts[i + 1];
    const code = parts[i + 2];
    if (code !== undefined) {
      nodes.push(<CodeBlock key={`c-${i}`} lang={lang} code={code} />);
    }
  }
  return nodes;
}

export default function MessageContent({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-1">
      {renderParts(content)}
      <button
        onClick={handleCopy}
        className={`mt-1 flex items-center gap-1 text-[11px] transition ${
          isUser ? "text-white/60 hover:text-white" : "text-subtle hover:text-brand"
        }`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}
