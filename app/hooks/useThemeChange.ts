'use client';

import { useEffect, useEffectEvent } from 'react';

/**
 * Runs `onChange` once the page has really switched between light and dark, for
 * things that read the theme's colours out of CSS (a canvas, mostly).
 *
 * It watches the class on `<html>` rather than the theme value: the provider
 * flips that class in an effect that runs after its children's, so re-reading
 * the colours when the value changes would pick up the outgoing theme every time.
 */
export function useThemeChange(onChange: () => void) {
  const handleChange = useEffectEvent(onChange);

  useEffect(() => {
    const root = document.documentElement;
    let light = root.classList.contains('light');
    const observer = new MutationObserver(() => {
      const nowLight = root.classList.contains('light');
      if (nowLight !== light) {
        light = nowLight;
        handleChange();
      }
    });
    observer.observe(root, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
}
