'use client';

import { type CSSProperties, Fragment, useRef } from 'react';

import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { useScrollFrame } from '../hooks/useScrollFrame';
import { useTranslation } from '../i18n';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function cssVars(vars: Record<`--${string}`, number>) {
  return vars as CSSProperties;
}

function Line({ text, lead = false }: { text: string; lead?: boolean }) {
  // An ordinary space only: a non-breaking one ties a Czech one-letter word to the next.
  const words = text.split(' ');

  return (
    <span
      className={`motto-line block ${lead ? 'motto-lead text-ink' : 'text-muted'}`}
      style={cssVars({ '--words': words.length })}
    >
      {words.map((word, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- a word can repeat in a line, and a sentence never reorders
        <Fragment key={index}>
          {index > 0 && ' '}
          <span className="motto-word" style={cssVars({ '--word': index })}>
            {word}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export function Motto() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();
  const blockRef = useRef<HTMLParagraphElement>(null);

  useScrollFrame(
    () => {
      const block = blockRef.current;
      if (!block) {
        return;
      }
      const rect = block.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 with the block just inside the bottom of the screen, 1 a little above its middle.
      const progress = clamp01((viewport * 0.88 - (rect.top + rect.height / 2)) / (viewport / 2));
      // The first line is read, then steps back as the second is read and stays lit.
      block.style.setProperty('--motto-first', clamp01(progress / 0.42).toFixed(4));
      block.style.setProperty('--motto-rest', clamp01((progress - 0.48) / 0.3).toFixed(4));
      block.style.setProperty('--motto-second', clamp01((progress - 0.45) / 0.55).toFixed(4));
    },
    { resize: true, enabled: shouldAnimate },
  );

  return (
    <div className="container py-24 md:py-40">
      <p ref={blockRef} className="section-title cta-title">
        <Line text={t('motto.line1')} />
        <Line text={t('motto.line2')} lead />
      </p>
    </div>
  );
}
