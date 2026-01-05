"use client";

import Image from "next/image";
import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTranslation } from "../i18n";
import { M } from "./Motion";

const trustedStudios = ["Meta", "Red Hook Studios", "3D Realms", "Bohemia Incubator"];

export function Hero() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();

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
          <M.h1
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6"
            initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldAnimate ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }
            }
          >
            <span className="gradient-text">{t("hero.tagline")}</span>
          </M.h1>

          <M.p
            className="text-lg sm:text-xl md:text-2xl text-[var(--color-text-secondary)] mb-8 md:mb-12 max-w-2xl mx-auto"
            initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldAnimate
                ? { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
                : { duration: 0 }
            }
          >
            {t("hero.subtitle")}
          </M.p>

          <M.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldAnimate
                ? { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
                : { duration: 0 }
            }
          >
            <M.a
              href="#projects"
              className="px-6 py-3 sm:px-8 sm:py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors transition-shadow hover:shadow-lg hover:shadow-accent/30"
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            >
              {t("hero.cta.projects")}
            </M.a>
            <M.a
              href="#contact"
              className="px-6 py-3 sm:px-8 sm:py-4 border border-[var(--color-text-muted)] hover:border-accent text-[var(--color-text)] font-semibold rounded-xl transition-colors backdrop-blur-sm"
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            >
              {t("hero.cta.contact")}
            </M.a>
          </M.div>
        </div>
      </div>

      <M.div
        className="absolute bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 w-full px-6"
        initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldAnimate ? { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 } : { duration: 0 }
        }
      >
        <div className="flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.35em] text-[var(--color-text-subtle)]">
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-text)]/20 to-transparent" />
          <span>{t("hero.trustedBy")}</span>
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-text)]/20 to-transparent" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-[var(--color-text-secondary)]">
          {trustedStudios.map((studio, index) => (
            <span key={studio} className="flex items-center gap-2">
              <span className="hover:text-[var(--color-text)] transition-colors">{studio}</span>
              {index < trustedStudios.length - 1 && (
                <span className="text-[var(--color-text-subtle)]">•</span>
              )}
            </span>
          ))}
        </div>
      </M.div>

      <M.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={shouldAnimate ? { y: [0, 8, 0] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Desktop Mouse */}
        <div className="hidden md:flex w-6 h-10 border-2 border-[var(--color-text-muted)] rounded-full justify-center pt-2">
          <div className="w-1 h-2 bg-accent rounded-full" />
        </div>

        {/* Mobile Touch Indicator */}
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
      </M.div>
    </section>
  );
}
