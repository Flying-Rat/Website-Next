'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { RAT_MARK } from './Logo';

/** The mark has to finish rising before its exit (0.24s ahead of the lift) begins. */
const MIN_LIFT_MS = 780;
/** The progress line completes in this long, then the mark and line leave. */
const FILL_FINISH_MS = 280;
/** The exits start this far ahead of the lift (see `.opening-curtain-mark`). */
const EXIT_LEAD_MS = 240;

function subscribeNoop() {
  return () => {};
}

const getHasHash = () => window.location.hash.length > 0;
const getServerHasHash = () => false;

function readTimeMs(name: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
}

/**
 * Time since the opening's CSS animations started on first paint. Finished
 * animations stop their clock at their end, so the furthest one is the truth.
 */
function openingElapsedMs() {
  let elapsed: number | null = null;
  for (const animation of document.getAnimations()) {
    if (
      animation instanceof CSSAnimation &&
      animation.animationName.startsWith('opening-') &&
      typeof animation.currentTime === 'number'
    ) {
      elapsed = Math.max(elapsed ?? 0, animation.currentTime);
    }
  }
  return elapsed;
}

/**
 * Full-viewport matte veil that opens the home page: the studio mark rises out
 * of its baseline, a coral line beneath it tracks loading, and the veil lifts
 * with a bowed edge into the hero choreography. Pure CSS activates it on first paint (so there is no
 * pre-hydration flash), and reduced-motion visitors never see it.
 *
 * The veil waits for the image marked `data-opening-cue` and the web fonts, up
 * to the `--opening-lift-delay` cap set in CSS.
 */
export function OpeningCurtain() {
  const shouldAnimate = useAnimationsEnabled();
  const hasHash = useSyncExternalStore(subscribeNoop, getHasHash, getServerHasHash);
  const [done, setDone] = useState(false);
  const fillRef = useRef<HTMLSpanElement>(null);

  const active = shouldAnimate && !hasHash && !done;

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }
    const root = document.documentElement;
    const capMs = readTimeMs('--opening-lift-delay');
    let cancelled = false;

    const setLiftDelay = (ms: number) => {
      root.style.setProperty('--opening-lift-delay', `${Math.min(capMs, ms)}ms`);
    };

    const release = () => {
      const elapsed = openingElapsedMs();
      if (cancelled || elapsed === null) {
        return;
      }
      const fill = fillRef.current;
      fill?.animate([{ transform: getComputedStyle(fill).transform }, { transform: 'scaleX(1)' }], {
        duration: FILL_FINISH_MS,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      });
      setLiftDelay(Math.max(MIN_LIFT_MS, elapsed + FILL_FINISH_MS + EXIT_LEAD_MS));
    };

    if (hasHash) {
      setLiftDelay(openingElapsedMs() ?? 0);
    } else {
      const cue = document.querySelector<HTMLImageElement>('img[data-opening-cue]');
      // A photo that fails to decode must not hold the veil; the cap still applies.
      void Promise.all([cue?.decode(), document.fonts.ready])
        .catch(() => {})
        .then(release);
    }

    return () => {
      cancelled = true;
      root.style.removeProperty('--opening-lift-delay');
    };
  }, [shouldAnimate, hasHash]);

  useEffect(() => {
    if (!active) {
      return;
    }
    // Safety net in case the tab is backgrounded and `animationend` never fires.
    const fallbackMs =
      readTimeMs('--opening-lift-delay') + readTimeMs('--opening-lift-duration') + 300;
    const timer = window.setTimeout(() => setDone(true), fallbackMs);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div
      className="opening-curtain fixed inset-0 items-center justify-center border-b border-line-strong bg-page"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.animationName === 'opening-curtain-lift'
        ) {
          setDone(true);
        }
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <span className="block overflow-hidden py-1">
          <svg
            viewBox="0 0 148 113"
            fill="currentColor"
            className="opening-curtain-mark h-9 w-auto text-ink sm:h-11"
          >
            <path fillRule="evenodd" d={RAT_MARK} />
          </svg>
        </span>
        <span className="opening-curtain-track block h-0.5 w-20 overflow-hidden rounded-full bg-line sm:w-24">
          <span ref={fillRef} className="opening-curtain-fill block size-full bg-accent" />
        </span>
      </div>
    </div>
  );
}
