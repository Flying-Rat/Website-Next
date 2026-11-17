'use client';

import Image from 'next/image';
import { type CSSProperties, useState } from 'react';

import { projects } from '../data/projects';
import { useLanguage } from '../i18n';
import { PlatformIcon } from './icons';

type Project = (typeof projects)[number];

// Reverse of the projects grid, so the feed opens on our own game (listed last there).
const unlockable = projects.filter((project) => project.image).toReversed();
const MAX_PLATFORMS = 4;

/** Seconds the very first notification waits for the hero photo to open. */
const FIRST_DELAY = 1.5;
/** The beat of empty photo between one notification leaving and the next arriving. */
const NEXT_DELAY = 0.18;

function UnlockItem({
  project,
  position,
  label,
  line,
}: {
  project: Project;
  position: number;
  label: string;
  line: string;
}) {
  return (
    <span className="unlock-item">
      <span className="unlock-cover relative aspect-video h-full shrink-0 overflow-hidden rounded-lg bg-surface-light">
        <Image src={project.image} alt="" fill sizes="96px" className="object-cover" />
      </span>
      <span className="unlock-text flex min-w-0 flex-1 flex-col gap-1">
        <span className="unlock-roll font-mono text-[10px] tracking-wide text-subtle uppercase">
          <span className="unlock-label flex min-w-0 items-center justify-between gap-3">
            <span className="truncate">{label}</span>
            <span className="shrink-0">
              {String(position + 1).padStart(2, '0')}/{String(unlockable.length).padStart(2, '0')}
            </span>
          </span>
          <span className="unlock-line truncate text-muted">{line}</span>
        </span>
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-sm leading-tight font-semibold">{project.title}</span>
          <span className="flex shrink-0 items-center gap-1.5 text-muted" aria-hidden="true">
            {project.platforms.slice(0, MAX_PLATFORMS).map((platform) => (
              <PlatformIcon key={platform.name} name={platform.name} />
            ))}
          </span>
        </span>
      </span>
    </span>
  );
}

/**
 * The timer bar's CSS animation is the clock. Its `animationend` ends the hold,
 * then a short second run of the same element times the exit, so pausing the
 * animation (hover, hidden tab) pauses the feed with no timers to manage.
 */
export function UnlockToast({
  label,
  linkLabel,
  animate,
}: {
  label: string;
  linkLabel: string;
  animate: boolean;
}) {
  const [language] = useLanguage();
  const [feed, setFeed] = useState({ step: 0, leaving: false });

  if (unlockable.length === 0) {
    return null;
  }

  const { step, leaving } = feed;
  const index = step % unlockable.length;
  const current = unlockable[index];
  const next = unlockable[(index + 1) % unlockable.length];
  const cycles = animate && unlockable.length > 1;

  return (
    // Named by what it shows (so "click Pit Panic" works for voice control), with
    // the destination appended. Focus pauses the feed, so the name holds still.
    <a
      href="#projects"
      className="unlock-toast"
      data-leaving={leaving || undefined}
      style={{ '--unlock-delay': `${step === 0 ? FIRST_DELAY : NEXT_DELAY}s` } as CSSProperties}
    >
      <span className="unlock-slot">
        <UnlockItem
          key={current.id}
          project={current}
          position={index}
          label={label}
          line={current.achievement[language]}
        />
      </span>
      <span className="sr-only">{linkLabel}</span>

      {cycles && (
        <>
          {/* Warm the next cover so the next notification never arrives with an empty frame. */}
          <Image
            key={`preload-${next.id}`}
            src={next.image}
            alt=""
            width={96}
            height={54}
            sizes="96px"
            className="pointer-events-none absolute size-px opacity-0"
            aria-hidden="true"
          />
          <span
            key={`${step}-${leaving ? 'out' : 'hold'}`}
            className={leaving ? 'unlock-timer unlock-timer-out' : 'unlock-timer'}
            onAnimationEnd={() =>
              setFeed((value) =>
                value.leaving
                  ? { step: value.step + 1, leaving: false }
                  : { step: value.step, leaving: true },
              )
            }
            aria-hidden="true"
          />
        </>
      )}
    </a>
  );
}
