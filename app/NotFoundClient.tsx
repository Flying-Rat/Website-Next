'use client';

import Link from 'next/link';

import { ArrowRightIcon } from './components/icons';
import { SecondaryPageShell } from './components/SecondaryPageShell';
import { useTranslation } from './i18n';

/** The 404 page, in the site's own shell so the header, footer and language switch still work. */
export function NotFoundClient() {
  const { t } = useTranslation();

  return (
    <SecondaryPageShell navItems={[]}>
      <section className="container flex min-h-[60vh] flex-col justify-center py-16 md:py-24">
        <p className="eyebrow">
          <span className="text-accent-ink">404</span> / {t('notFound.label')}
        </p>
        <h1 className="section-title mt-4 max-w-3xl">{t('notFound.title')}</h1>
        <p className="section-subtitle mt-5 max-w-xl">{t('notFound.body')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">
            {t('notFound.home')}
            <ArrowRightIcon className="btn-arrow size-4" />
          </Link>
          <Link href="/#projects" className="btn btn-secondary">
            {t('notFound.work')}
          </Link>
        </div>
      </section>
    </SecondaryPageShell>
  );
}
