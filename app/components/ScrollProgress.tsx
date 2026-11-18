'use client';

import { useRef } from 'react';

import { useScrollFrame } from '../hooks/useScrollFrame';

export function ScrollProgress() {
  const railRef = useRef<HTMLDivElement | null>(null);

  useScrollFrame(
    () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      railRef.current?.style.setProperty('--progress', progress.toFixed(4));
    },
    { resize: true },
  );

  return (
    <div ref={railRef} className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress-bar" />
    </div>
  );
}
