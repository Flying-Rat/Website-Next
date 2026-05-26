import type { ReactNode } from 'react';

/**
 * Lightweight formatting for project blurbs:
 * - `[label](https://example.com)` → external link (new tab)
 * - `**phrase**` → bold (only in segments outside link labels / URLs)
 */
const LINK_PATTERN = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g;

function formatTextChunk(chunk: string, keyPrefix: number): ReactNode[] {
  if (!chunk) {
    return [];
  }

  const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
  const out: ReactNode[] = [];
  let last = 0;
  let mi = 0;
  let m: RegExpExecArray | null;
  while ((m = BOLD_PATTERN.exec(chunk)) !== null) {
    if (m.index > last) {
      out.push(chunk.slice(last, m.index));
    }
    out.push(
      <strong
        key={`sk-${keyPrefix}-${mi}`}
        className="font-semibold text-[var(--color-text)]"
      >
        {m[1]}
      </strong>,
    );
    mi += 1;
    last = BOLD_PATTERN.lastIndex;
  }
  if (last < chunk.length) {
    out.push(chunk.slice(last));
  }
  return out;
}

export function renderSimpleMarkdown(text: string): ReactNode {
  LINK_PATTERN.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let keyCounter = 0;

  while ((m = LINK_PATTERN.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(...formatTextChunk(text.slice(lastIndex, m.index), keyCounter++));
    }
    const href = m[2];
    if (!/^https?:\/\//i.test(href)) {
      nodes.push(...formatTextChunk(m[0], keyCounter++));
    } else {
      nodes.push(
        <a
          key={`lk-${keyCounter++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent underline decoration-accent/45 underline-offset-[3px] transition-colors hover:decoration-accent"
        >
          {m[1]}
        </a>,
      );
    }
    lastIndex = LINK_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(...formatTextChunk(text.slice(lastIndex), keyCounter++));
  }

  if (nodes.length === 0) {
    return <>{formatTextChunk(text, 0)}</>;
  }

  return <>{nodes}</>;
}
