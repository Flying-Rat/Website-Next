'use client';

import { type RefObject, useEffect, useState } from 'react';

type InViewOptions = {
  /** Stay true after the first sighting and stop watching. */
  once?: boolean;
  /** Grows (or, when negative, shrinks) the viewport the element is tested against. */
  rootMargin?: string;
  /** How much of the element must be visible, from 0 to 1. */
  threshold?: number;
};

export function useInView(
  ref: RefObject<Element | null>,
  { once = false, rootMargin, threshold }: InViewOptions = {},
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setInView(visible);
        if (visible && once) {
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, once, rootMargin, threshold]);

  return inView;
}
