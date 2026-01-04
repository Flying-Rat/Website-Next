"use client";

import { useEffect } from "react";

export function useSectionObserver() {
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const newHash = id === "hero" ? "" : `#${id}`;
            if (window.location.hash !== newHash) {
              window.history.replaceState(null, "", newHash || window.location.pathname);
            }
            break;
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);
}
