'use client';

import { useEffect } from 'react';

import { usePageIdle } from '../hooks/usePageIdle';
import { useTranslation } from '../i18n';
import { absoluteUrl, SITE_NAME } from '../lib/site';

// Survives client navigation and Strict Mode's double effects, so the greeting
// prints once per page load.
let greeted = false;

// DevTools draws the console in its own document: it cannot resolve the page's
// CSS variables or web fonts. Colours are read from the live tokens instead, and
// the fonts are named so anyone who has them installed sees the real thing.
const SANS = "'Mona Sans', ui-sans-serif, system-ui, sans-serif";
const MONO = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace";

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Pads every line of every block to the longest one, so blocks printed in
 * different colours still line up as one solid card.
 */
function card(...blocks: string[]) {
  const split = blocks.map((block) => block.split('\n').map((line) => `  ${line}  `));
  const width = Math.max(...split.flat().map((line) => line.length));
  return split.map((lines) => lines.map((line) => line.padEnd(width)).join('\n'));
}

export function ConsoleGreeting() {
  const { t, i18n } = useTranslation();
  const idle = usePageIdle();

  useEffect(() => {
    if (!idle || greeted) {
      return;
    }
    greeted = true;

    const bg = token('--color-bg');
    const ink = token('--color-text');
    const muted = token('--color-text-muted');
    const accent = token('--color-accent');
    const accentInk = token('--color-accent-text');
    const onAccent = token('--color-on-accent');
    const body = `font: 13px/1.7 ${MONO}; background: ${bg};`;
    const status = `> rat.status()\n${t('console.status').replaceAll(/^/gm, '  ')}`;
    const [story, link, hint] = card(
      `${t('console.intro')}\n\n${status}\n\n${t('console.cta')}`,
      absoluteUrl('/jobs'),
      `\n${t('console.hire')}\n`,
    );
    const hire = () => {
      window.location.assign('/jobs');
      return i18n.t('console.hireReply');
    };

    // oxlint-disable-next-line no-console -- the console is where this easter egg lives
    console.log(
      `%c ${SITE_NAME.toUpperCase()} %c\n%c${card(t('console.greeting'))[0]}`,
      `font: 800 28px/1.4 ${SANS}; font-stretch: 125%; letter-spacing: 0.02em; color: ${onAccent}; background: ${accent}; padding: 6px 14px; border-radius: 6px;`,
      '',
      `font: 600 16px/2 ${SANS}; color: ${ink}; background: ${bg};`,
    );
    // oxlint-disable-next-line no-console -- the console is where this easter egg lives
    console.log(
      `%c${story}\n%c${link}\n%c${hint}`,
      `${body} color: ${muted};`,
      `${body} color: ${accentInk}; font-weight: 700;`,
      `${body} color: ${ink};`,
    );

    // The card above prints `rat.status()` like a command, so it has to answer.
    const rat = {
      status: () => {
        // oxlint-disable-next-line no-console -- the console is where this easter egg lives
        console.log(`%c${card(i18n.t('console.status'))[0]}`, `${body} color: ${ink};`);
        return i18n.t('console.statusReply');
      },
      hire,
    };
    Object.defineProperties(window, {
      rat: { configurable: true, value: rat },
      hire: { configurable: true, value: hire },
    });
  }, [idle, t, i18n]);

  return null;
}
