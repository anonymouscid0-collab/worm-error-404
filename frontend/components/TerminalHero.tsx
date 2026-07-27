"use client";

import { useEffect, useState } from "react";

const BOOT_LINES = [
  "$ initializing worm_error_404.core...",
  "Traceback (most recent call last):",
  '  File "project.py", line 404, in <module>',
  "    raise WormError('undefined behavior in your stack')",
  "WormError: 404 — solution not found",
  "",
  "$ resolving exception...",
  "> patching stack trace with senior full-stack reasoning",
  "> compiling frontend, backend, database, tests",
  "> exception resolved. shipping build.",
];

export default function TerminalHero() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCursorLine, setShowCursorLine] = useState(true);

  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) {
      setShowCursorLine(false);
      return;
    }
    const delay = BOOT_LINES[visibleLines] === "" ? 200 : 380;
    const timeout = setTimeout(() => setVisibleLines((n) => n + 1), delay);
    return () => clearTimeout(timeout);
  }, [visibleLines]);

  return (
    <div className="w-full max-w-xl rounded-lg border border-line bg-panel/70 shadow-[0_0_60px_-15px_rgba(57,255,136,0.25)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-phosphor/70" />
        <span className="ml-3 font-mono text-[11px] text-fog">worm_error_404 — zsh</span>
      </div>
      <div className="min-h-[280px] px-5 py-5 font-mono text-[13px] leading-relaxed">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith("WormError")
                ? "text-error"
                : line.startsWith(">")
                ? "text-phosphor"
                : line.startsWith("$")
                ? "text-amber"
                : "text-fog"
            }
          >
            {line || "\u00A0"}
          </div>
        ))}
        {showCursorLine && (
          <span className="inline-block h-4 w-2 animate-blink bg-phosphor align-middle" />
        )}
      </div>
    </div>
  );
}
