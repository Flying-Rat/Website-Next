"use client";

import Image from "next/image";
import { useTranslation } from "../i18n";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-[var(--color-border)]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/fr_horizontal_black.png"
              alt="Flying Rat Studio"
              width={120}
              height={30}
              className="logo-dark h-6 w-auto opacity-70"
            />
            <Image
              src="/fr_horizontal_white.png"
              alt="Flying Rat Studio"
              width={120}
              height={30}
              className="logo-light h-6 w-auto opacity-70"
            />
            <span className="text-[var(--color-text-muted)] text-sm">
              © {year} {t("footer.rights")}
            </span>
          </div>
          <p className="text-[var(--color-text-subtle)] text-sm">{t("footer.cookies")}</p>
        </div>
      </div>
    </footer>
  );
}
