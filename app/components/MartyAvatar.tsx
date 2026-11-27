'use client';

import { useRef } from 'react';

import { useInView } from '../hooks/useInView';

type MartyAvatarProps = {
  className?: string;
  /** Accessible name; without one the avatar is decorative. */
  label?: string;
};

/**
 * Marty's avatar: the orb the assistant app draws for itself, so Marty looks the
 * same here as in the product. The drawing and its motion live in `globals.css`.
 */
export function MartyAvatar({ className = '', label }: MartyAvatarProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref);

  return (
    <span
      ref={ref}
      data-live={inView}
      className={`orb block shrink-0 ${className}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <span className="orb-field">
        <span className="orb-disc orb-disc-1" />
        <span className="orb-disc orb-disc-2" />
        <span className="orb-disc orb-disc-3" />
        <span className="orb-core" />
      </span>
      <span className="orb-lens" />
    </span>
  );
}
