"use client";

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let frame = 0;
    let last = -1;

    const updateProgress = () => {
      frame = 0;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;
      const next = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      if (Math.abs(next - last) < 0.1) {
        return;
      }
      last = next;
      const bar = barRef.current;
      if (bar) {
        bar.style.width = `${next}%`;
      }
    };

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100]">
      <div
        ref={barRef}
        className="scroll-progress-bar h-full transition-all duration-150 ease-out bg-gradient-to-r from-accent via-accent to-accent/50"
        style={{ width: "0%" }}
      />
    </div>
  );
}
