'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { RAT_MARK } from './Logo';

// Safety net in case the tab is backgrounded and `animationend` never fires.
const CURTAIN_FALLBACK_MS = 1500;

function subscribeNoop() {
  return () => {};
}

const getHasHash = () => window.location.hash.length > 0;
const getServerHasHash = () => false;

/**
 * Full-viewport matte veil that opens the home page: the studio mark rises out
 * of its baseline, a coral hairline draws beneath it, and the veil lifts into
 * the hero choreography. Pure CSS activates it on first paint (so there is no
 * pre-hydration flash), and reduced-motion visitors never see it.
 */
export function OpeningCurtain() {
  const shouldAnimate = useAnimationsEnabled();
  const hasHash = useSyncExternalStore(subscribeNoop, getHasHash, getServerHasHash);
  const [done, setDone] = useState(false);

  const active = shouldAnimate && !hasHash && !done;

  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = window.setTimeout(() => setDone(true), CURTAIN_FALLBACK_MS);
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
      <div className="opening-curtain-stage flex flex-col items-center gap-5">
        <span className="block overflow-hidden py-1">
          <svg
            viewBox="0 0 148 113"
            fill="currentColor"
            className="opening-curtain-mark h-9 w-auto text-ink sm:h-11"
          >
            <path fillRule="evenodd" d={RAT_MARK} />
          </svg>
        </span>
        <span className="opening-curtain-rule block h-0.5 w-14 rounded-full bg-accent sm:w-16" />
      </div>
    </div>
  );
}
