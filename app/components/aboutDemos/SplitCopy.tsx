import { Fragment, type ReactNode } from 'react';

/**
 * The section's half of `splitCopy`: copy rendered as spans marked `data-target`,
 * which is all a demo knows about it. The spans are inline, so the text wraps and
 * kerns exactly as it does unsplit; a demo that moves one changes its box itself.
 */

/** A word as letters. It never breaks across lines. */
function Letters({ word }: { word: string }) {
  return (
    <span className="whitespace-nowrap">
      {Array.from(word, (letter, index) => (
        <span key={index} data-target="">
          {letter}
        </span>
      ))}
    </span>
  );
}

/** A run of text: plain, or cut into the pieces asked for. */
export function SplitText({ text, by }: { text: string; by: 'words' | 'letters' | undefined }) {
  if (!by) {
    return text;
  }
  const seen = new Map<string, number>();
  const words = text.split(' ').map((word) => {
    const nth = (seen.get(word) ?? 0) + 1;
    seen.set(word, nth);
    return (
      <Fragment key={`${word} ${nth}`}>
        {by === 'letters' ? <Letters word={word} /> : <span data-target="">{word}</span>}{' '}
      </Fragment>
    );
  });
  if (by === 'words') {
    return words;
  }
  // Screen readers spell out text that is cut into letters, so they get it whole.
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{words}</span>
    </>
  );
}

/** Something that is not plain text, such as a figure, as a single piece. */
export function SplitPiece({ split, children }: { split: boolean; children: ReactNode }) {
  return split ? (
    <span data-target="" className="inline-block">
      {children}
    </span>
  ) : (
    children
  );
}
