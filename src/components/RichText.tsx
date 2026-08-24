import * as React from "react";

// ─── COMPONENT: RICH TEXT ────────────────────────────────────────────────────
// Les modèles rédigent en Markdown léger. Ce rendu prend en charge le gras,
// l'italique et le code court, sans injecter de HTML : les astérisques ne
// doivent plus apparaître telles quelles à l'écran.
const INLINE_MARKDOWN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE_MARKDOWN).filter(Boolean).map((chunk, i) => {
    const key = `${keyPrefix}-${i}`;
    if (chunk.startsWith("**") && chunk.endsWith("**") && chunk.length > 4) {
      return <strong key={key} className="font-bold text-white">{chunk.slice(2, -2)}</strong>;
    }
    if (chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2) {
      return <em key={key} className="italic opacity-90">{chunk.slice(1, -1)}</em>;
    }
    if (chunk.startsWith("`") && chunk.endsWith("`") && chunk.length > 2) {
      return (
        <code key={key} className="font-mono text-[0.9em] bg-white/[0.06] rounded px-1 py-0.5">
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={key}>{chunk}</React.Fragment>;
  });
}

export function RichText({ text, className }: { text: string; className?: string; key?: React.Key }) {
  const lines = text.split("\n");
  return (
    <p className={className}>
      {lines.map((line, i) => (
        <React.Fragment key={`l-${i}`}>
          {i > 0 && <br />}
          {renderInline(line, `l-${i}`)}
        </React.Fragment>
      ))}
    </p>
  );
}
