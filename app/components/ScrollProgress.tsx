"use client";

import { useEffect, useRef } from "react";

import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const lastRef = useRef(-1);
  const shouldAnimate = useAnimationsEnabled();

  useEffect(() => {
    const updateProgress = () => {
      frameRef.current = 0;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;
      const next = maxScroll > 0 ? scrollTop / maxScroll : 0;
      if (Math.abs(next - lastRef.current) < 0.001) {
        return;
      }
      lastRef.current = next;
      const bar = barRef.current;
      if (bar) {
        bar.style.transform = `scaleX(${next})`;
      }
    };

    const requestUpdate = () => {
      if (frameRef.current === 0) {
        frameRef.current = window.requestAnimationFrame(updateProgress);
      }
    };

    if (shouldAnimate) {
      requestUpdate();
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);
    } else {
      updateProgress();
      window.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", updateProgress);
    }
    return () => {
      if (frameRef.current !== 0) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (shouldAnimate) {
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
      } else {
        window.removeEventListener("scroll", updateProgress);
        window.removeEventListener("resize", updateProgress);
      }
    };
  }, [shouldAnimate]);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100]">
      <div
        ref={barRef}
        className="scroll-progress-bar h-full transition-transform duration-150 ease-out bg-gradient-to-r from-accent via-accent to-accent/50"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
