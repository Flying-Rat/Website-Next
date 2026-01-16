"use client";

import type { ReactNode } from "react";

import { Footer } from "./Footer";
import { PageHeader } from "./PageHeader";
import { ScrollProgress } from "./ScrollProgress";

type SecondaryPageShellProps = {
  navItems: { id: string; label: string }[];
  children: ReactNode;
};

export function SecondaryPageShell({ navItems, children }: SecondaryPageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <ScrollProgress />
      <PageHeader navItems={navItems} />
      <main className="pt-24 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
