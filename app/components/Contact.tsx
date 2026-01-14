"use client";

import Image from "next/image";

import { useTranslation } from "../i18n";
import { FadeInView } from "./FadeInView";
import { MailIcon } from "./icons";
import { SocialLinks } from "./SocialLinks";

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
          <FadeInView animation="up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {t("contact.title")}
            </h2>
            <p className="text-[var(--color-text-muted)] text-base md:text-lg mb-8 md:mb-12 max-w-xl mx-auto">
              {t("contact.subtitle")}
            </p>
          </FadeInView>

          <FadeInView animation="up" delay={0.1} margin="-50px" className="mb-10 md:mb-16">
            <div className="flex flex-col items-center gap-4">
              <div className="relative hover:scale-105 transition-transform">
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
              </div>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-accent/30 text-lg hover:scale-105 active:scale-98"
              >
                <MailIcon className="w-6 h-6" />
                {t("contact.cta")}
              </a>
              <p className="text-[var(--color-text-subtle)] text-sm">{email}</p>
            </div>
          </FadeInView>

          <FadeInView animation="up" delay={0.2} margin="-50px">
            <p className="text-[var(--color-text-muted)] mb-6">{t("contact.social")}</p>
            <SocialLinks />
            <a
              href="https://x.com/search?q=%23flyingWithRats"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 text-accent hover:text-accent-dark transition-colors font-medium"
            >
              #flyingWithRats
            </a>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
