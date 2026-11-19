'use client';

import { useEffect, useState } from 'react';

import { projects } from '../data/projects';
import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { usePageIdle } from '../hooks/usePageIdle';
import { useTheme } from '../hooks/useTheme';
import { useLanguage, useTranslation } from '../i18n';
import { absoluteUrl, CONTACT_EMAILS, SITE_NAME } from '../lib/site';
import { RAT_MARK } from './Logo';

// Module state survives client navigation and Strict Mode's double effects, so
// the greeting prints once per page load and the rat remembers its snacks.
let greeted = false;
let cheeseEaten = 0;

// DevTools draws the console in its own document: it cannot resolve the page's
// CSS variables or web fonts. Colours are read from the live tokens instead, and
// the fonts are named so anyone who has them installed sees the real thing.
const SANS = "'Mona Sans', ui-sans-serif, system-ui, sans-serif";
const MONO = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const COMMANDS = [
  'status',
  'games',
  'fly',
  'theme',
  'lang',
  'cheese',
  'sudo',
  'contact',
  'hire',
] as const;

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Console styles from the theme that is showing right now. */
function palette() {
  const bg = token('--color-bg');
  const body = `font: 13px/1.7 ${MONO}; background: ${bg};`;
  return {
    bg,
    ink: token('--color-text'),
    accent: token('--color-accent'),
    onAccent: token('--color-on-accent'),
    body: `${body} color: ${token('--color-text')};`,
    muted: `${body} color: ${token('--color-text-muted')};`,
    link: `${body} color: ${token('--color-accent-text')}; font-weight: 700;`,
  };
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

/** `label ....... value` rows, with the dots lined up. */
function leaders(rows: [string, string][]) {
  const width = Math.max(...rows.map(([label]) => label.length)) + 3;
  return rows.map(([label, value]) => `${`${label} `.padEnd(width, '.')} ${value}`).join('\n');
}

function print(text: string, style: string) {
  // oxlint-disable-next-line no-console -- the console is where this easter egg lives
  console.log(`%c${card(text)[0]}`, style);
}

function FlyingRat({ onLanded }: { onLanded: () => void }) {
  return (
    <svg
      viewBox="0 0 148 113"
      fill="currentColor"
      aria-hidden="true"
      className="rat-flight pointer-events-none fixed top-1/3 left-0 z-60 h-14 w-auto text-accent"
      onAnimationEnd={onLanded}
    >
      <path fillRule="evenodd" d={RAT_MARK} />
    </svg>
  );
}

export function ConsoleGreeting() {
  const { t } = useTranslation();
  const [language, setLanguage] = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const animate = useAnimationsEnabled();
  const idle = usePageIdle();
  const [flight, setFlight] = useState(0);

  useEffect(() => {
    if (!idle || greeted) {
      return;
    }
    greeted = true;

    const colors = palette();
    const status = `> rat.status()\n${t('console.status').replaceAll(/^/gm, '  ')}`;
    const [story, link, hint] = card(
      `${t('console.intro')}\n\n${status}\n\n${t('console.cta')}`,
      absoluteUrl('/jobs'),
      `\n${t('console.hint')}\n`,
    );

    // oxlint-disable-next-line no-console -- the console is where this easter egg lives
    console.log(
      `%c ${SITE_NAME.toUpperCase()} %c\n%c${card(t('console.greeting'))[0]}`,
      `font: 800 28px/1.4 ${SANS}; font-stretch: 125%; letter-spacing: 0.02em; color: ${colors.onAccent}; background: ${colors.accent}; padding: 6px 14px; border-radius: 6px;`,
      '',
      `font: 600 16px/2 ${SANS}; color: ${colors.ink}; background: ${colors.bg};`,
    );
    // oxlint-disable-next-line no-console -- the console is where this easter egg lives
    console.log(`%c${story}\n%c${link}\n%c${hint}`, colors.muted, colors.link, colors.body);
  }, [idle, t]);

  // Rebuilt whenever the language or theme changes, so every reply is current.
  useEffect(() => {
    const hire = () => {
      window.location.assign('/jobs');
      return t('console.hireReply');
    };

    const rat = {
      help: () => {
        const width = Math.max(...COMMANDS.map((name) => name.length)) + 8;
        const lines = COMMANDS.map(
          (name) => `${`rat.${name}()`.padEnd(width)}${t(`console.help.${name}`)}`,
        );
        print(lines.join('\n'), palette().body);
        return t('console.helpReply');
      },
      status: () => {
        print(t('console.status'), palette().body);
        return t('console.statusReply');
      },
      games: () => {
        print(leaders(projects.map((project) => [project.title, project.studio])), palette().body);
        return t('console.gamesReply');
      },
      fly: () => {
        if (!animate) {
          return t('console.flyGrounded');
        }
        setFlight((count) => count + 1);
        return t('console.flyReply');
      },
      theme: () => {
        const next = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        return t(next === 'dark' ? 'console.themeDark' : 'console.themeLight');
      },
      lang: () => {
        const next = language === 'en' ? 'cs' : 'en';
        setLanguage(next);
        return t('console.langReply', { lng: next });
      },
      cheese: () => {
        const replies = t('console.cheese', { returnObjects: true }) as string[];
        const reply = replies[Math.min(cheeseEaten, replies.length - 1)];
        cheeseEaten += 1;
        return reply;
      },
      sudo: () => t('console.sudoReply'),
      contact: () => {
        print(CONTACT_EMAILS.general, palette().link);
        return t('console.contactReply');
      },
      hire,
    };

    Object.defineProperties(window, {
      rat: { configurable: true, value: rat },
      hire: { configurable: true, value: hire },
    });
  }, [t, language, setLanguage, resolvedTheme, setTheme, animate]);

  return flight > 0 ? <FlyingRat key={flight} onLanded={() => setFlight(0)} /> : null;
}
