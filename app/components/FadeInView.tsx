"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";

type Animation = "up" | "left" | "right" | "scale";

interface FadeInViewProps {
  children: ReactNode;
  animation?: Animation;
  delay?: number;
  margin?: string;
  className?: string;
  /** Animate transform only — skips opacity so backdrop-filter children work during the slide */
  slideOnly?: boolean;
}

const transforms: Record<Animation, string> = {
  up: "translateY(30px)",
  left: "translateX(-40px)",
  right: "translateX(40px)",
  scale: "translateY(40px) scale(0.98)",
};

export function FadeInView({
  children,
  animation = "up",
  delay = 0,
  margin = "-100px",
  className = "",
  slideOnly = false,
}: FadeInViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldAnimate = useAnimationsEnabled();
  const [isVisible, setIsVisible] = useState(!shouldAnimate);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || hasAnimated.current) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay * 1000);
          } else {
            setIsVisible(true);
          }
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldAnimate, margin, delay]);

  const style: CSSProperties = shouldAnimate
    ? {
        opacity: slideOnly ? 1 : isVisible ? 1 : 0,
        transform: isVisible ? "none" : transforms[animation],
        transition: slideOnly
          ? "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)"
          : "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      }
    : {};

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={className} style={style}>
      {children}
    </div>
  );
}
