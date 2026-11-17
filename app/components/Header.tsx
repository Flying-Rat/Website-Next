'use client';

import Link from 'next/link';

import { useTranslation } from '../i18n';
import { Logo } from './Logo';
import { SiteHeader } from './SiteHeader';

const navSections = [
  { href: '#about', key: 'nav.about' },
  { href: '#what-we-do', key: 'nav.whatWeDo' },
  { href: '#projects', key: 'nav.projects' },
  { href: '/jobs', key: 'nav.jobs' },
  { href: '#contact', key: 'nav.contact' },
  { href: 'https://tech.flying-rat.studio/', key: 'nav.blog' },
];

export function Header() {
  const { t } = useTranslation();

  return (
    <SiteHeader
      navLabel={t('nav.primary')}
      links={navSections.map(({ href, key }) => ({ href, label: t(key) }))}
      brand={
        <Link href="/" className="shrink-0">
          <Logo className="h-8 md:h-9" />
        </Link>
      }
    />
  );
}
