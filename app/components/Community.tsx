'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { useTranslation } from '../i18n';
import { PARTNER_URLS } from '../lib/site';
import { FOUNDER } from './ContactSection';
import { FadeInView } from './FadeInView';
import { ExternalLinkIcon, MailIcon } from './icons';

const EVENT_EMAIL = 'marty+events@flying-rat.studio';

const items = [
  {
    key: 'gda',
    href: 'https://gda.cz/',
    label: 'gda.cz',
    dot: 'bg-gda',
    hover: 'group-hover:text-gda',
  },
  {
    key: 'bnf',
    href: 'https://bnf.events/',
    label: 'bnf.events',
    dot: 'bg-bonfire',
    hover: 'group-hover:text-bonfire-ink',
  },
  {
    key: 'dekoder',
    href: 'https://dekoder.fm/',
    label: 'dekoder.fm',
    dot: 'bg-dekoder',
    hover: 'group-hover:text-dekoder',
  },
  {
    key: 'events',
    href: `mailto:${EVENT_EMAIL}`,
    label: EVENT_EMAIL,
    dot: 'bg-accent',
    hover: 'group-hover:text-accent-ink',
  },
];

const partners = [
  {
    key: 'zet',
    href: PARTNER_URLS.zetLabs,
    label: 'zetlabs.ai',
    logo: { src: '/images/partners/zet-labs.webp', width: 765, height: 138 },
    logoClass: 'h-5 md:h-6',
    dot: 'bg-zet',
    hover: 'group-hover:text-zet-ink',
  },
  {
    key: 'plana',
    href: PARTNER_URLS.planA,
    label: 'planacollective.com',
    logo: { src: '/images/partners/plan-a.webp', width: 960, height: 385 },
    logoClass: 'h-11 md:h-12',
    dot: 'bg-plana',
    hover: 'group-hover:text-plana',
  },
];

function RuleHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-5 md:mb-10">
      <h2 className="font-display shrink-0 text-xl font-semibold md:text-2xl">{children}</h2>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function Community() {
  const { t } = useTranslation();

  return (
    <section id="community" className="relative py-14 md:py-20">
      <div className="container">
        <FadeInView margin="-60px">
          <RuleHeading>{t('community.title')}</RuleHeading>

          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(({ key, href, label, dot, hover }) => {
              const isMail = href.startsWith('mailto:');
              const Icon = isMail ? MailIcon : ExternalLinkIcon;
              return (
                <li key={key}>
                  <a
                    href={href}
                    target={isMail ? undefined : '_blank'}
                    rel={isMail ? undefined : 'noopener noreferrer'}
                    className="group block"
                  >
                    <span className="eyebrow flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${dot}`} />
                      {t(`community.items.${key}.tag`)}
                    </span>
                    <span
                      className={`font-display mt-3 block text-xl font-semibold transition-colors duration-300 ${hover}`}
                    >
                      {t(`community.items.${key}.name`)}
                    </span>
                    <span className="mt-1.5 block max-w-[17rem] text-md leading-relaxed text-pretty text-muted">
                      {t(`community.items.${key}.body`)}
                    </span>
                    <span className="mt-3 flex items-center gap-1.5 font-mono text-xs text-subtle transition-colors duration-300 group-hover:text-ink">
                      {label}
                      <Icon className={isMail ? 'size-3.5' : 'size-2.5'} />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <figure className="mt-10 grid gap-x-8 gap-y-3 border-t border-line pt-6 md:mt-12 lg:grid-cols-4">
            <figcaption className="flex items-center gap-2 self-start text-meta leading-tight">
              <Image
                src={FOUNDER.photo}
                alt=""
                width={24}
                height={24}
                sizes="24px"
                className="size-6 shrink-0 rounded-full object-cover"
              />
              <span className="font-semibold text-ink">{FOUNDER.name}</span>
              <span className="text-muted">{t(FOUNDER.roleKey)}</span>
            </figcaption>
            <blockquote className="max-w-3xl text-meta leading-relaxed text-pretty text-muted lg:col-span-3">
              <p>
                <span className="text-ink">{t('community.note.lead')}</span>{' '}
                {t('community.note.body1')} {t('community.note.body2')}
              </p>
            </blockquote>
          </figure>
        </FadeInView>

        <FadeInView margin="-60px" className="mt-14 md:mt-20">
          <RuleHeading>{t('community.partners.title')}</RuleHeading>
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
            {partners.map(({ key, href, label, logo, logoClass, dot, hover }) => (
              <li key={key}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="group block">
                  <span className="flex h-14 items-center">
                    <Image
                      src={logo.src}
                      alt=""
                      width={logo.width}
                      height={logo.height}
                      sizes="200px"
                      className={`partner-logo w-auto opacity-90 transition-opacity duration-300 group-hover:opacity-100 ${logoClass}`}
                    />
                  </span>
                  <span className="eyebrow mt-6 flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${dot}`} />
                    {t(`community.partners.${key}.tag`)}
                  </span>
                  <span
                    className={`font-display mt-3 block text-xl font-semibold transition-colors duration-300 ${hover}`}
                  >
                    {t(`community.partners.${key}.name`)}
                  </span>
                  <span className="mt-1.5 block max-w-lg text-md leading-relaxed text-pretty text-muted">
                    {t(`community.partners.${key}.body`)}
                  </span>
                  <span className="mt-3 flex items-center gap-1.5 font-mono text-xs text-subtle transition-colors duration-300 group-hover:text-ink">
                    {label}
                    <ExternalLinkIcon className="size-2.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </FadeInView>
      </div>
    </section>
  );
}
