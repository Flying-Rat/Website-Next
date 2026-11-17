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
          className="group -my-3 flex items-center gap-2 py-3 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon className="size-4 transition-transform duration-300 ease-smooth group-hover:-translate-x-0.5" />
          <span>{t('nav.backHome')}</span>
        </Link>
      }
    />
  );
}
