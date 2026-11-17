'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useRef } from 'react';

import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { useInView } from '../hooks/useInView';

type Animation = 'up' | 'left' | 'right';

const offsets: Record<Animation, string> = {
  up: 'translateY(20px)',
  left: 'translateX(-24px)',
  right: 'translateX(24px)',
};

/**
 * Eases its children in the first time they scroll into view. The motion itself
 * is the `.reveal` class in globals.css; this only decides when to release it.
 */
export function FadeInView({
  children,
  animation = 'up',
  delay = 0,
  margin = '-100px',
  className = '',
}: {
  children: ReactNode;
  animation?: Animation;
  /** Seconds to wait after coming into view. */
  delay?: number;
  /** Root margin for the in-view test; negative values wait until it is well inside. */
  margin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldAnimate = useAnimationsEnabled();
  const seen = useInView(ref, { once: true, rootMargin: margin });

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-pending={shouldAnimate && !seen ? '' : undefined}
      style={
        { '--reveal-from': offsets[animation], '--reveal-delay': `${delay}s` } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
