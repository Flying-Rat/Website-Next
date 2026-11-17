'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { useTranslation } from '../i18n';
import { FadeInView } from './FadeInView';
import { ArrowRightIcon } from './icons';
import { SocialLinks } from './SocialLinks';

export type ContactPerson = {
  name: string;
  photo: string;
  /** Translation keys for the role line and the button label. */
  roleKey: string;
  ctaKey: string;
};

/** Business and press inquiries go to a person; Marty stays the face of jobs and events. */
export const FOUNDER: ContactPerson = {
  name: 'Martin Pernica',
  photo: '/images/martin.webp',
  roleKey: 'contact.person.role',
  ctaKey: 'contact.person.cta',
};

type ContactSectionProps = {
  id?: string;
  titleKey: string;
  descriptionKey: string;
  /** Unused when `person` is set. */
  martyAltKey?: string;
  person?: ContactPerson;
  email: string;
  ctaKey?: string;
  socialKey?: string;
  statusKey?: string;
  afterSocial?: ReactNode;
  secondary?: { leadKey: string; email: string };
  withFadeIn?: boolean;
};

export function ContactSection({
  id,
  titleKey,
  descriptionKey,
  martyAltKey = 'contact.martyAlt',
  person,
  email,
  ctaKey = person?.ctaKey ?? 'contact.cta',
  socialKey = 'contact.social',
  statusKey = 'contact.statusAvailable',
  afterSocial,
  secondary,
  withFadeIn = false,
}: ContactSectionProps) {
  const { t } = useTranslation();

  const header = (
    <>
      <h2 className="section-title cta-title">{t(titleKey)}</h2>
      <p className="section-subtitle mt-6 max-w-md">{t(descriptionKey)}</p>
    </>
  );

  const contactCard = (
    <div className="surface-card p-5 sm:p-6">
      {/* Below 380px the avatar and address step down a size, so the longest
          address (press) still fits on one line instead of being cut off. */}
      <div className="flex items-center gap-3 min-[380px]:gap-4">
        <Image
          src={person ? person.photo : '/images/marty.webp'}
          alt={person ? person.name : t(martyAltKey)}
          width={56}
          height={56}
          className="size-12 shrink-0 rounded-full object-cover min-[380px]:size-14"
        />
        {person ? (
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-2 leading-tight">
              <span className="font-display text-[17px] font-semibold text-ink">{person.name}</span>
              <span className="text-sm text-muted">{t(person.roleKey)}</span>
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
              <span className="status-dot" />
              {t(statusKey)}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="truncate font-mono text-xs text-ink min-[380px]:text-meta sm:max-lg:text-xs lg:text-sm">
              {email}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <span className="status-dot" />
              {t(statusKey)}
            </p>
          </div>
        )}
      </div>
      {/* A personal address is too long to sit beside the photo on a small phone,
          so it gets the card's full width. */}
      {person && (
        <p // In the two-column range the card is as narrow as on a small phone.
          className="mt-4 truncate font-mono text-xs text-secondary min-[380px]:text-meta sm:max-lg:text-xs"
        >
          {email}
        </p>
      )}
      <a href={`mailto:${email}`} className={`btn btn-primary w-full ${person ? 'mt-3' : 'mt-5'}`}>
        {t(ctaKey)}
        <ArrowRightIcon className="btn-arrow size-4" />
      </a>
      {secondary && (
        <a
          href={`mailto:${secondary.email}`}
          className="group -mx-5 mt-5 -mb-5 flex items-center gap-3 rounded-b-[calc(1rem-1px)] border-t border-line px-5 py-4 transition-colors duration-300 hover:bg-surface-light sm:-mx-6 sm:-mb-6 sm:px-6"
        >
          <Image
            src="/images/marty.webp"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm leading-snug text-pretty text-muted">
              {t(secondary.leadKey)}
            </span>
            <span className="mt-1 block truncate font-mono text-xs text-ink min-[380px]:text-meta">
              {secondary.email}
            </span>
          </span>
          <ArrowRightIcon className="size-4 shrink-0 text-subtle transition-[color,transform] duration-300 ease-smooth group-hover:translate-x-0.5 group-hover:text-ink" />
        </a>
      )}
    </div>
  );

  const socialBlock = (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-sm text-muted">{t(socialKey)}</p>
        {afterSocial}
      </div>
      <SocialLinks />
    </div>
  );

  const aside = (
    <>
      {contactCard}
      {socialBlock}
    </>
  );

  return (
    <section id={id} className="section-pad relative border-t border-line">
      <div className="container">
        <div className="grid gap-10 sm:max-lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:max-lg:gap-8 lg:grid-cols-12 lg:gap-8">
          {/* min-w-0: grid items refuse to shrink below their content by default, which
              let the card's one-line address push the whole page wider than a small phone. */}
          <div className="min-w-0 lg:col-span-7">
            {withFadeIn ? <FadeInView animation="up">{header}</FadeInView> : header}
          </div>
          <div className="min-w-0 lg:col-span-5 xl:col-span-4 xl:col-start-9">
            {withFadeIn ? (
              <FadeInView animation="up" delay={0.1} margin="-50px">
                {aside}
              </FadeInView>
            ) : (
              aside
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
