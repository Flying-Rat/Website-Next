"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useTranslation } from "../i18n";
import { MailIcon, socialLinks } from "./icons";

export function Contact() {
  const { t } = useTranslation();
  const email = "marty@flying-rat.studio";

  return (
    <section id="contact" className="py-16 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-accent/10 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {t("contact.title")}
            </h2>
            <p className="text-[var(--color-text-muted)] text-base md:text-lg mb-8 md:mb-12 max-w-xl mx-auto">
              {t("contact.subtitle")}
            </p>
          </motion.div>

          <motion.div
            className="mb-10 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src="/images/marty.png"
                  alt="Marty"
                  width={80}
                  height={80}
                  className="avatar-ring"
                />
                <div
                  className="absolute -bottom-1 -right-1 status-online"
                  title={t("contact.statusAvailable")}
                />
              </motion.div>
              <motion.a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors hover:shadow-lg hover:shadow-accent/30 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <MailIcon className="w-6 h-6" />
                {t("contact.cta")}
              </motion.a>
              <p className="text-[var(--color-text-subtle)] text-sm">{email}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <p className="text-[var(--color-text-muted)] mb-6">{t("contact.social")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.url}
                  className="w-12 h-12 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-xl flex items-center justify-center transition-colors group"
                  title={link.name}
                  aria-label={link.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <link.Icon className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
                </motion.a>
              ))}
            </div>
            <motion.a
              href="https://x.com/search?q=%23flyingWithRats"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 text-accent hover:text-accent-dark transition-colors font-medium"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              #flyingWithRats
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
