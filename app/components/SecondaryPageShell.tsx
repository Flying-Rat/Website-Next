'use client';

import type { ReactNode } from 'react';

import { Footer } from './Footer';
import { PageHeader } from './PageHeader';
import { ScrollProgress } from './ScrollProgress';
import { CONTENT_ID, SkipLink } from './SkipLink';

type SecondaryPageShellProps = {
  navItems: { id: string; label: string }[];
  children: ReactNode;
};

export function SecondaryPageShell({ navItems, children }: SecondaryPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-page text-ink">
      <SkipLink />
      <ScrollProgress />
      <PageHeader navItems={navItems} />
      <main id={CONTENT_ID} tabIndex={-1} className="flex-1 pt-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
