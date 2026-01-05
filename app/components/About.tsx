"use client";

import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTranslation } from "../i18n";
import { M } from "./Motion";
import { RetroScene } from "./RetroScene";

const aboutStats = [
  { value: "8+", key: "about.stats.projects" },
  { value: "10+", key: "about.stats.years" },
  { value: "100%", key: "about.stats.passion" },
];

export function About() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();

  const containerVariants = {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        when: "beforeChildren",
      },
    },
  };

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="about" className="py-16 md:py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <M.div
              initial={shouldAnimate ? "hidden" : "visible"}
              animate={!shouldAnimate ? "visible" : undefined}
              whileInView={shouldAnimate ? "visible" : undefined}
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              transition={shouldAnimate ? undefined : { duration: 0 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                {t("about.title")}
              </h2>
              <div className="space-y-3 md:space-y-4 text-[var(--color-text-muted)] text-base md:text-lg">
                <p>{t("about.description1")}</p>
                <p>{t("about.description2")}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 md:mt-10">
                {aboutStats.map((stat, index) => (
                  <M.div
                    key={stat.key}
                    className="text-center md:text-left"
                    variants={statVariants}
                    custom={index}
                    transition={shouldAnimate ? { delay: 0.2 + index * 0.1 } : { duration: 0 }}
                  >
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-[var(--color-text-subtle)] mt-1">
                      {t(stat.key)}
                    </div>
                  </M.div>
                ))}
              </div>
            </M.div>

            <M.div
              className="relative aspect-square w-full max-w-sm mx-auto md:max-w-full"
              initial={shouldAnimate ? { opacity: 0, x: 40 } : { opacity: 1, x: 0 }}
              animate={!shouldAnimate ? { opacity: 1, x: 0 } : undefined}
              whileInView={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
              viewport={{ once: true, margin: "-100px" }}
              transition={
                shouldAnimate
                  ? { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
                  : { duration: 0 }
              }
            >
              <RetroScene label={t("about.focus.title")} shouldAnimate={shouldAnimate} />
            </M.div>
          </div>
        </div>
      </div>
    </section>
  );
}
