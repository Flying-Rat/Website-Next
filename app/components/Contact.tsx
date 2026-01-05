"use client";

import Image from "next/image";
import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTranslation } from "../i18n";
import { MailIcon, socialLinks } from "./icons";
import { M } from "./Motion";

export function Contact() {
  const { t } = useTranslation();
  const email = "marty@flying-rat.studio";
  const shouldAnimate = useAnimationsEnabled();

  const socialContainerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.2,
        when: "beforeChildren",
      },
    },
  };

  const socialItemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  const hashtagVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, delay: 0.2 },
    },
  };

  return (
    <section id="contact" className="py-16 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-accent/10 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <M.div
            initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
            animate={!shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, margin: "-100px" }}
            transition={
              shouldAnimate ? { duration: 0.7, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }
            }
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {t("contact.title")}
            </h2>
            <p className="text-[var(--color-text-muted)] text-base md:text-lg mb-8 md:mb-12 max-w-xl mx-auto">
              {t("contact.subtitle")}
            </p>
          </M.div>

          <M.div
            className="mb-10 md:mb-16"
            initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
            animate={!shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, margin: "-50px" }}
            transition={
              shouldAnimate
                ? { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
                : { duration: 0 }
            }
          >
            <div className="flex flex-col items-center gap-4">
              <M.div
                className="relative"
                whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
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
              </M.div>
              <M.a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors hover:shadow-lg hover:shadow-accent/30 text-lg"
                whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              >
                <MailIcon className="w-6 h-6" />
                {t("contact.cta")}
              </M.a>
              <p className="text-[var(--color-text-subtle)] text-sm">{email}</p>
            </div>
          </M.div>

          <M.div
            initial={shouldAnimate ? "hidden" : "visible"}
            animate={!shouldAnimate ? "visible" : undefined}
            whileInView={shouldAnimate ? "visible" : undefined}
            viewport={{ once: true, margin: "-50px" }}
            variants={socialContainerVariants}
            transition={shouldAnimate ? undefined : { duration: 0 }}
          >
            <p className="text-[var(--color-text-muted)] mb-6">{t("contact.social")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {socialLinks.map((link, index) => (
                <M.a
                  key={link.name}
                  href={link.url}
                  className="w-12 h-12 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-xl flex items-center justify-center transition-colors group"
                  title={link.name}
                  aria-label={link.name}
                  variants={socialItemVariants}
                  transition={shouldAnimate ? { delay: index * 0.05 } : { duration: 0 }}
                  whileHover={shouldAnimate ? { scale: 1.1, y: -2 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                >
                  <link.Icon className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
                </M.a>
              ))}
            </div>
            <M.a
              href="https://x.com/search?q=%23flyingWithRats"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 text-accent hover:text-accent-dark transition-colors font-medium"
              variants={hashtagVariants}
              transition={shouldAnimate ? undefined : { duration: 0 }}
            >
              #flyingWithRats
            </M.a>
          </M.div>
        </div>
      </div>
    </section>
  );
}
