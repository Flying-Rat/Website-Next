'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * Becomes true (once) when the element is within `margin` of the viewport.
 * Use it to defer loading heavy below-the-fold content.
 */
export function useNearViewport(ref: RefObject<Element | null>, margin = '600px') {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (near || !element) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin, near]);

  return near;
}
