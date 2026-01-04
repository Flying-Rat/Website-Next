"use client";

import { motion } from "motion/react";
import { useTranslation } from "../i18n";
import { GameplayDemo } from "./GameplayDemo";

const aboutStats = [
  { value: "8+", key: "about.stats.projects" },
  { value: "10+", key: "about.stats.years" },
  { value: "100%", key: "about.stats.passion" },
];

export function About() {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                {t("about.title")}
              </h2>
              <div className="space-y-4 text-[var(--color-text-muted)] text-lg">
                <p>{t("about.description1")}</p>
                <p>{t("about.description2")}</p>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-10">
                {aboutStats.map((stat, index) => (
                  <motion.div
                    key={stat.key}
                    className="text-center md:text-left"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.5,
                      delay: 0.2 + index * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div className="text-3xl md:text-4xl font-bold text-accent">{stat.value}</div>
                    <div className="text-sm text-[var(--color-text-subtle)] mt-1">
                      {t(stat.key)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative aspect-square"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <GameplayDemo label={t("about.focus.title")} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
