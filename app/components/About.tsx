"use client";

import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTranslation } from "../i18n";
import { FadeInView } from "./FadeInView";
import { RetroScene } from "./RetroScene";

const aboutStats = [
  { value: "8+", key: "about.stats.projects" },
  { value: "10+", key: "about.stats.years" },
  { value: "100%", key: "about.stats.passion" },
];

export function About() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();

  return (
    <section id="about" className="section-pad relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <FadeInView animation="left">
              <h2 className="section-title mb-4 md:mb-6">{t("about.title")}</h2>
              <div className="section-subtitle space-y-3 md:space-y-4">
                <p>{t("about.description1")}</p>
                <p>{t("about.description2")}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 md:mt-10">
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
            </FadeInView>

            <FadeInView
              animation="right"
              delay={0.1}
              className="relative aspect-square w-full max-w-sm mx-auto md:max-w-full"
            >
              <RetroScene label={t("about.focus.title")} shouldAnimate={shouldAnimate} />
            </FadeInView>
          </div>
        </div>
      </div>
    </section>
  );
}
