"use client";

import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTranslation } from "../i18n";
import { CubeScene } from "./CubeScene";
import { FadeInView } from "./FadeInView";

const aboutStats = [
  { value: "8+", key: "about.stats.projects" },
  { value: "10+", key: "about.stats.years" },
  { value: "100%", key: "about.stats.passion" },
];

export function About() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();

  return (
    <section id="about" className="section-pad relative min-h-[560px]">
      <div className="absolute inset-0" aria-hidden="true">
        <CubeScene
          label={t("about.focus.title")}
          shouldAnimate={shouldAnimate}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="h-44 sm:h-24 md:h-0" aria-hidden="true" />
        <div className="max-w-6xl mx-auto">
          <FadeInView animation="left" slideOnly>
            <div className="inline-block rounded-3xl px-8 py-8 md:px-10 md:py-10 backdrop-blur-xl bg-white/[0.06] dark:bg-white/[0.04] border border-white/[0.10] dark:border-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_40px_rgba(0,0,0,0.28)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_40px_rgba(0,0,0,0.55)]">
              <h2 className="section-title mb-4 md:mb-6">{t("about.title")}</h2>
              <div className="section-subtitle space-y-3 md:space-y-4 max-w-xl">
                <p>{t("about.description1")}</p>
                <p>{t("about.description2")}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 md:mt-10 max-w-sm">
                {aboutStats.map((stat, index) => (
                  <FadeInView
                    key={stat.key}
                    animation="up"
                    delay={0.2 + index * 0.1}
                    margin="-50px"
                  >
                    <div className="text-center md:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent">
                        {stat.value}
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--color-text-subtle)] mt-1">
                        {t(stat.key)}
                      </div>
                    </div>
                  </FadeInView>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
