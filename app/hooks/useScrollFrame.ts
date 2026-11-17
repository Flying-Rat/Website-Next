'use client';

import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Calls `onFrame` once on mount and then at most once per animation frame while
 * the page scrolls (and, with `resize`, while the window resizes).
 */
export function useScrollFrame(
  onFrame: () => void,
  { resize = false, enabled = true }: { resize?: boolean; enabled?: boolean } = {},
) {
  const handleFrame = useEffectEvent(onFrame);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frame = 0;
    const run = () => {
      frame = 0;
      handleFrame();
    };
    const request = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(run);
      }
    };

    request();
    window.addEventListener('scroll', request, { passive: true });
    if (resize) {
      window.addEventListener('resize', request);
    }
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
  }, [enabled, resize]);
}

export function useScrolledPast(offset: number) {
  const [past, setPast] = useState(false);
  useScrollFrame(() => setPast(window.scrollY > offset));
  return past;
}
