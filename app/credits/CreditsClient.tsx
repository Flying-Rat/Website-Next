'use client';

import { ExternalLinkIcon } from '../components/icons';
import { SecondaryPageShell } from '../components/SecondaryPageShell';
import { SplitSection } from '../components/SplitSection';
import { useTranslation } from '../i18n';

type Credit = {
  /** Locale key under `credits.items`, holding what the project does for this site. */
  key: string;
  name: string;
  /** Who makes it; left out when the name already says so. */
  by?: string;
  /** Made largely by its community: adds "and contributors" after the name above. */
  community?: boolean;
  /** SPDX-style licence name; left out for a hosted service. */
  licence?: string;
  href: string;
};

/**
 * Only what the site visibly stands on. Licences are the ones each project
 * publishes; smaller packages are credited in their own files, as their licences ask.
 */
const groups: { id: string; items: Credit[] }[] = [
  {
    id: 'foundation',
    items: [
      { key: 'next', name: 'Next.js', by: 'Vercel', licence: 'MIT', href: 'https://nextjs.org' },
      { key: 'react', name: 'React', by: 'Meta', licence: 'MIT', href: 'https://react.dev' },
      {
        key: 'typescript',
        name: 'TypeScript',
        by: 'Microsoft',
        licence: 'Apache-2.0',
        href: 'https://www.typescriptlang.org',
      },
    ],
  },
  {
    id: 'design',
    items: [
      {
        key: 'tailwind',
        name: 'Tailwind CSS',
        by: 'Tailwind Labs',
        licence: 'MIT',
        href: 'https://tailwindcss.com',
      },
      {
        key: 'monaSans',
        name: 'Mona Sans',
        by: 'GitHub',
        licence: 'SIL OFL 1.1',
        href: 'https://github.com/github/mona-sans',
      },
      {
        key: 'geistMono',
        name: 'Geist Mono',
        by: 'Vercel',
        licence: 'SIL OFL 1.1',
        href: 'https://vercel.com/font',
      },
    ],
  },
  {
    id: 'experience',
    items: [
      {
        key: 'three',
        name: 'three.js',
        by: 'mrdoob',
        community: true,
        licence: 'MIT',
        href: 'https://threejs.org',
      },
      {
        key: 'i18next',
        name: 'i18next',
        by: 'Jan Mühlemann',
        community: true,
        licence: 'MIT',
        href: 'https://www.i18next.com',
      },
    ],
  },
  {
    id: 'delivery',
    items: [
      { key: 'vercel', name: 'Vercel', href: 'https://vercel.com' },
      { key: 'bun', name: 'Bun', by: 'Oven', licence: 'MIT', href: 'https://bun.sh' },
      {
        key: 'oxc',
        name: 'Oxc',
        by: 'Boshen',
        community: true,
        licence: 'MIT',
        href: 'https://oxc.rs',
      },
    ],
  },
];

export function CreditsClient() {
  const { t } = useTranslation();
  const navItems = groups.map(({ id }) => ({ id, label: t(`credits.groups.${id}`) }));

  return (
    <SecondaryPageShell navItems={navItems}>
      <div className="container pb-20 md:pb-28">
        <header className="max-w-3xl pt-6 pb-12 md:pt-10 md:pb-16">
          <p className="eyebrow">{t('credits.eyebrow')}</p>
          <h1 className="section-title cta-title mt-4">{t('credits.title')}</h1>
          <p className="section-subtitle mt-5 max-w-xl">{t('credits.subtitle')}</p>
        </header>

        {groups.map(({ id, items }) => (
          <SplitSection key={id} id={id} title={t(`credits.groups.${id}`)}>
            <ul className="-mt-5 md:-mt-6">
              {items.map(({ key, name, by, community, licence, href }) => (
                <li key={key} className="border-b border-line last:border-b-0">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group grid gap-x-8 gap-y-2 py-5 sm:grid-cols-[minmax(0,1fr)_auto] md:py-6"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-2xl font-semibold transition-colors duration-300 group-hover:text-accent-ink md:text-3xl">
                        {name}
                      </span>
                      {by && (
                        <span className="eyebrow">
                          {community ? t('credits.community', { name: by }) : by}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-xs text-subtle max-sm:order-last max-sm:mt-1 sm:row-span-2 sm:self-start sm:pt-2.5">
                      {licence ?? t('credits.service')}
                      <ExternalLinkIcon className="size-3 transition-transform duration-300 ease-smooth group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                    <span className="max-w-xl text-md leading-relaxed text-pretty text-muted">
                      {t(`credits.items.${key}`)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </SplitSection>
        ))}

        <section className="border-t border-line pt-12 md:pt-16">
          <p className="font-display max-w-3xl text-2xl leading-snug font-semibold text-balance md:text-3xl">
            {t('credits.thanks')}
          </p>
          <div className="mt-6 max-w-2xl space-y-3 text-md leading-relaxed text-pretty text-muted">
            <p>{t('credits.licences')}</p>
            <p>{t('credits.trademarks')}</p>
          </div>
        </section>
      </div>
    </SecondaryPageShell>
  );
}
