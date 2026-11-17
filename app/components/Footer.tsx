'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { useTranslation } from '../i18n';
import { Logo } from './Logo';

/** The year of this build (see next.config.ts): what the server prints, and what
 *  the browser starts from before swapping in its own year. */
const BUILD_YEAR = Number(process.env.BUILD_YEAR);
const subscribeToNothing = () => () => {};
const getYear = () => new Date().getFullYear();
const getBuildYear = () => BUILD_YEAR;

export function Footer() {
  const { t } = useTranslation();
  const year = useSyncExternalStore(subscribeToNothing, getYear, getBuildYear);

  return (
    <footer className="border-t border-line pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:pt-12 md:pb-12">
      <div className="container">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4">
            <Logo className="h-7 self-start" />
            <p className="max-w-xs text-sm text-subtle">{t('footer.cookies')}</p>
          </div>
          {/* Negative margin + padding: finger-sized targets without moving the text. */}
          <nav aria-label={t('footer.navLabel')} className="-my-3 flex gap-6 text-sm text-muted">
            <Link href="/jobs" className="py-3 transition-colors hover:text-ink">
              {t('footer.jobs')}
            </Link>
            <Link href="/press" className="py-3 transition-colors hover:text-ink">
              {t('footer.press')}
            </Link>
            <Link href="/credits" className="py-3 transition-colors hover:text-ink">
              {t('footer.credits')}
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 font-mono text-[11px] leading-relaxed text-subtle md:flex-row md:justify-between md:gap-8">
          <span className="shrink-0">
            © {year} {t('footer.rights')}
          </span>
          <p className="md:text-right">
            {/* Each part stays whole, so a narrow screen breaks between them, not inside a number. */}
            <span className="whitespace-nowrap">GADEN ALPHA s.r.o.</span> |{' '}
            <span className="whitespace-nowrap">IČO: 09949194</span> |{' '}
            <span className="whitespace-nowrap">DIČ: CZ09949194</span>
            <span className="hidden md:inline">
              {' '}
              | Polní 21, 252 64 Velké Přílepy | Zapsáno u&nbsp;MS v&nbsp;Praze, C 345227
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
