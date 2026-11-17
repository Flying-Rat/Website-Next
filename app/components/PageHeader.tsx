'use client';

import Link from 'next/link';

import { useTranslation } from '../i18n';
import { ArrowLeftIcon } from './icons';
import { SiteHeader } from './SiteHeader';

type PageNavItem = {
  id: string;
  label: string;
};

export function PageHeader({ navItems }: { navItems: PageNavItem[] }) {
  const { t } = useTranslation();

  return (
    <SiteHeader
      navLabel={t('nav.onThisPage')}
      links={navItems.map(({ id, label }) => ({ href: `#${id}`, label }))}
      brand={
        <Link
          href="/"
          className="group -my-1 flex items-center gap-2.5 py-1 text-sm font-medium text-ink"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-line-strong transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-page">
            <ArrowLeftIcon className="size-4 transition-transform duration-300 ease-smooth group-hover:-translate-x-0.5" />
          </span>
          <span>{t('nav.backHome')}</span>
        </Link>
      }
    />
  );
}
