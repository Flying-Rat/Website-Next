'use client';

import { useRef } from 'react';

import { useScrollFrame } from '../hooks/useScrollFrame';

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useScrollFrame(
    () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${maxScroll > 0 ? scrollTop / maxScroll : 0})`;
      }
    },
    { resize: true },
  );

  return (
    <div className="fixed top-0 right-0 left-0 z-[100] h-[2px]" aria-hidden="true">
      <div
        ref={barRef}
        className="scroll-progress-bar h-full bg-accent transition-transform duration-150 ease-out"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
