'use client';

import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

/**
 * Which demo the About section shows. Kept apart from the registry so the
 * switcher, which every demo draws, can read it without importing the demos.
 */

/** In the order the switcher lists them. */
export const DEMO_NAMES = ['rockfall', 'cannon3d', 'island'] as const;
export type DemoName = (typeof DEMO_NAMES)[number];
/** Every visit opens on this one; the page is prerendered with it. */
const DEFAULT_DEMO: DemoName = 'rockfall';

/** Lives only as long as the page: a reload opens on the default again. */
let chosen: DemoName = DEFAULT_DEMO;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDemoName(): DemoName {
  return useSyncExternalStore(
    subscribe,
    () => chosen,
    () => DEFAULT_DEMO,
  );
}

/** Swaps the demo in place, cross-fading the section to it. */
export function chooseDemo(name: DemoName) {
  const swap = () => {
    chosen = name;
    // The transition photographs the page when this returns, so React has to
    // have drawn the new demo by then.
    flushSync(() => {
      for (const listener of listeners) {
        listener();
      }
    });
  };
  const still =
    document.documentElement.classList.contains('no-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !document.startViewTransition) {
    swap();
  } else {
    document.startViewTransition(swap);
  }
}
