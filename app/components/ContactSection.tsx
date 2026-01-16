"use client";

import type { ReactNode } from "react";

import Image from "next/image";

import { useTranslation } from "../i18n";
import { FadeInView } from "./FadeInView";
import { MailIcon } from "./icons";
import { SocialLinks } from "./SocialLinks";

type ContactSectionProps = {
  id?: string;
  titleKey: string;
  descriptionKey: string;
  martyAltKey: string;
  email: string;
  ctaKey?: string;
  socialKey?: string;
  statusKey?: string;
  afterSocial?: ReactNode;
  withFadeIn?: boolean;
};

export function ContactSection({
  id,
  titleKey,
  descriptionKey,
  martyAltKey,
  email,
  ctaKey = "contact.cta",
  socialKey = "contact.social",
  statusKey = "contact.statusAvailable",
  afterSocial,
  withFadeIn = false,
}: ContactSectionProps) {
  const { t } = useTranslation();

  const header = (
    <>
      <h2 className="section-title mb-3 md:mb-4">{t(titleKey)}</h2>
      <p className="section-subtitle mb-8 max-w-xl mx-auto">{t(descriptionKey)}</p>
    </>
  );

  const contactCard = (
    <div className="flex flex-col items-center gap-4 mb-10">
      <div className="relative hover:scale-105 transition-transform">
        <Image
          src="/images/marty.png"
          alt={t(martyAltKey)}
          width={80}
          height={80}
          className="avatar-ring"
        />
        <div className="absolute -bottom-1 -right-1 status-online" title={t(statusKey)} />
      </div>
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-accent/30 text-lg hover:scale-105 active:scale-98"
      >
        <MailIcon className="w-6 h-6" />
        {t(ctaKey)}
      </a>
      <p className="text-[var(--color-text-subtle)] text-sm">{email}</p>
    </div>
  );

  const socialBlock = (
    <>
      <p className="text-[var(--color-text-muted)] mb-6">{t(socialKey)}</p>
      <SocialLinks />
      {afterSocial}
    </>
  );

  return (
    <section id={id} className="section-pad relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-accent/10 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {withFadeIn ? <FadeInView animation="up">{header}</FadeInView> : header}
          {withFadeIn ? (
            <FadeInView animation="up" delay={0.1} margin="-50px">
              {contactCard}
            </FadeInView>
          ) : (
            contactCard
          )}
          {withFadeIn ? (
            <FadeInView animation="up" delay={0.2} margin="-50px">
              {socialBlock}
            </FadeInView>
          ) : (
            socialBlock
          )}
        </div>
      </div>
    </section>
  );
}
