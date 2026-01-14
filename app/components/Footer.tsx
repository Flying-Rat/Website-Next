"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "../i18n";

const year = new Date().getFullYear();

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="py-8 border-t border-[var(--color-border)]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between md:gap-4">
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
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
          <div className="flex flex-col items-center gap-3 md:items-end md:gap-1">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[var(--color-text-subtle)] text-sm">
              <p className="hidden sm:block">{t("footer.cookies")}</p>
              <span className="hidden sm:block opacity-30">|</span>
              <Link
                href="/jobs"
                className="hover:text-[var(--color-text-muted)] transition-colors inline-flex items-center gap-1"
              >
                {t("footer.jobs")} 💼
              </Link>
              <span className="opacity-30">|</span>
              <Link
                href="/press"
                className="hover:text-[var(--color-text-muted)] transition-colors inline-flex items-center gap-1"
              >
                {t("footer.press")} 📰
              </Link>
            </div>
            <p className="text-[var(--color-text-subtle)] text-[10px] opacity-50 text-center md:text-right max-w-xs md:max-w-none">
              GADEN ALPHA s.r.o. | IČO: 09949194 | DIČ: CZ09949194
              <span className="hidden md:inline"> | Polní 21, 252 64 Velké Přílepy | Zapsáno u MS v Praze, C 345227</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
