"use client";

import { motion } from "motion/react";
import { useTranslation } from "../i18n";
import { AiIcon, BackendIcon, EngineeringIcon, PortingIcon, QaIcon, ReleaseIcon } from "./icons";

const whatWeDoItems = [
  {
    key: "engineering",
    accent: "from-accent/30 via-accent/5 to-transparent",
    Icon: EngineeringIcon,
  },
  {
    key: "porting",
    accent: "from-accent/30 via-accent/5 to-transparent",
    Icon: PortingIcon,
  },
  {
    key: "qa",
    accent: "from-accent/30 via-accent/5 to-transparent",
    Icon: QaIcon,
  },
  {
    key: "release",
    accent: "from-accent/30 via-accent/5 to-transparent",
    Icon: ReleaseIcon,
  },
  {
    key: "backend",
    accent: "from-accent/30 via-accent/5 to-transparent",
    Icon: BackendIcon,
  },
  {
    key: "ai",
    accent: "from-accent/30 via-accent/5 to-transparent",
    Icon: AiIcon,
  },
];

export function WhatWeDo() {
  const { t } = useTranslation();

  return (
    <section id="what-we-do" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[var(--color-text)]/5 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t("whatWeDo.title")}</h2>
          <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
            {t("whatWeDo.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {whatWeDoItems.map((item, index) => {
            const title = t(`whatWeDo.${item.key}.title`);
            const body = t(`whatWeDo.${item.key}.body`);
            const Icon = item.Icon;

            return (
              <motion.div
                key={item.key}
                className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 backdrop-blur-xl p-8 transition-colors duration-500 hover:border-accent/20 hover:bg-[var(--color-surface)]/60"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
              >
                {/* Inner glass highlight */}
                <div className="absolute inset-0 rounded-3xl border border-[var(--color-border)]/50 pointer-events-none" />

                {/* Hover Gradient Overlay */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${item.accent}`}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6">
                  <div className="relative shrink-0">
                    <div className="h-16 w-16 rounded-2xl bg-[var(--color-surface)]/80 border border-[var(--color-border)] flex items-center justify-center text-accent shadow-sm transition-colors duration-300 backdrop-blur-md">
                      <Icon className="h-8 w-8" />
                    </div>
                    {/* Icon Glow */}
                    <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-text)] transition-colors duration-300">
                      {title}
                    </h3>
                    <p className="text-[var(--color-text-muted)] leading-relaxed group-hover:text-[var(--color-text-secondary)] transition-colors duration-300">
                      {body}
                    </p>
                  </div>
                </div>

                {/* Subtle glass reflection gradient */}
                <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-[var(--color-text)]/5 to-transparent rotate-45 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
