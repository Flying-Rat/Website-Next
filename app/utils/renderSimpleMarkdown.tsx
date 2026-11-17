import type { ReactNode } from 'react';

/**
 * Lightweight formatting for project blurbs.
 *
 * Blocks, separated by a blank line:
 * - lines that all start with `- ` → a bullet list
 * - anything else → a paragraph
 *
 * Inline, inside either:
 * - `[label](https://example.com)` → external link (new tab)
 * - `**phrase**` → bold (only in segments outside link labels / URLs)
 */
const LINK_PATTERN = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g;
const BULLET_PREFIX = /^-\s+/;

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
    out.push(<strong key={`sk-${keyPrefix}-${mi}`}>{m[1]}</strong>);
    mi += 1;
    last = BOLD_PATTERN.lastIndex;
  }
  if (last < chunk.length) {
    out.push(chunk.slice(last));
  }
  return out;
}

function renderInline(text: string): ReactNode[] {
  LINK_PATTERN.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let keyCounter = 0;

  while ((m = LINK_PATTERN.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(...formatTextChunk(text.slice(lastIndex, m.index), keyCounter++));
    }
    nodes.push(
      <a
        key={`lk-${keyCounter++}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="blurb-link"
      >
        {m[1]}
      </a>,
    );
    lastIndex = LINK_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(...formatTextChunk(text.slice(lastIndex), keyCounter++));
  }
  return nodes;
}

/** Renders a blurb as block elements (`<p>` and `<ul>`); wrap the result in a container, not a `<p>`. */
export function renderSimpleMarkdown(text: string): ReactNode {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block) => {
        const lines = block.split('\n').map((line) => line.trim());
        if (lines.every((line) => BULLET_PREFIX.test(line))) {
          return (
            // A blurb never repeats a paragraph or a bullet, so the text itself is the key.
            <ul key={block} className="blurb-list">
              {lines.map((line) => (
                <li key={line}>{renderInline(line.replace(BULLET_PREFIX, ''))}</li>
              ))}
            </ul>
          );
        }
        return <p key={block}>{renderInline(lines.join(' '))}</p>;
      })}
    </>
  );
}
