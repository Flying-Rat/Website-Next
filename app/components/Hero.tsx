"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTranslation } from "../i18n";

const trustedStudios = ["Meta", "Red Hook Studios", "3D Realms", "Bohemia Incubator"];

export function Hero() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getStyle = (delayMs: number): CSSProperties => {
    if (!shouldAnimate) {
      return {};
    }
    const isVisible = mounted;
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "none" : "translateY(30px)",
      transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
    };
  };

  return (
    <section
      id="hero"
      className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden pt-20 pb-32 md:pt-0 md:pb-0"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/team.png"
          alt=""
          fill
          className="hero-image object-cover object-center opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/70 via-[var(--color-bg)]/50 to-[var(--color-bg)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)]/60 via-transparent to-[var(--color-bg)]/60" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6"
            style={getStyle(0)}
          >
            <span className="gradient-text">{t("hero.tagline")}</span>
          </h1>

          <p
            className="text-lg sm:text-xl md:text-2xl text-[var(--color-text-secondary)] mb-8 md:mb-12 max-w-2xl mx-auto"
            style={getStyle(100)}
          >
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center" style={getStyle(200)}>
            <a
              href="#projects"
              className="px-6 py-3 sm:px-8 sm:py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-accent/30 hover:scale-105 active:scale-95"
            >
              {t("hero.cta.projects")}
            </a>
            <a
              href="#contact"
              className="px-6 py-3 sm:px-8 sm:py-4 border border-[var(--color-text-muted)] hover:border-accent text-[var(--color-text)] font-semibold rounded-xl transition-all backdrop-blur-sm hover:scale-105 active:scale-95"
            >
              {t("hero.cta.contact")}
            </a>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 w-full px-6"
        style={getStyle(300)}
      >
        <div className="flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.35em] text-[var(--color-text-subtle)]">
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-text)]/20 to-transparent" />
          <span>{t("hero.trustedBy")}</span>
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-text)]/20 to-transparent" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-0 gap-y-2 text-xs md:text-sm text-[var(--color-text-secondary)]">
          {trustedStudios.map((studio, index) => (
            <span key={studio} className="inline-flex items-center">
              <span className="hover:text-[var(--color-text)] transition-colors">{studio}</span>
              {index < trustedStudios.length - 1 && (
                <span className="mx-3 w-3 text-center text-[var(--color-text-subtle)]">•</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="hidden md:flex w-6 h-10 border-2 border-[var(--color-text-muted)] rounded-full justify-center pt-2">
          <div
            className={`w-1 h-2 bg-accent rounded-full ${shouldAnimate ? "animate-scroll-wheel" : ""}`}
          />
        </div>
        <div className="md:hidden text-[var(--color-text-muted)]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Scroll Indicator</title>
            <path d="M7 7l5 5 5-5" />
            <path d="M7 13l5 5 5-5" />
          </svg>
        </div>
      </div>
    </section>
  );
}
