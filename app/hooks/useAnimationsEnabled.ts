import { useLayoutEffect, useSyncExternalStore } from 'react';

import { isPrivacyBrowser } from '../lib/motionDetect';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function getShouldAnimate() {
  return !(window.matchMedia(REDUCED_MOTION).matches || isPrivacyBrowser(navigator.userAgent));
}

function subscribeToReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

/**
 * Whether motion is welcome: false when the visitor asked for reduced motion (or
 * uses a browser that hides that preference). Also mirrors the answer onto
 * `<html>` as `.no-motion`, which is what the stylesheet keys on.
 */
export function useAnimationsEnabled() {
  // The server cannot know, so it assumes motion and the browser corrects it.
  const shouldAnimate = useSyncExternalStore(
    subscribeToReducedMotion,
    getShouldAnimate,
    () => true,
  );

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('no-motion', !shouldAnimate);
  }, [shouldAnimate]);

  return shouldAnimate;
}
