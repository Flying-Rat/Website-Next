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
          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex items-center gap-3 text-[var(--color-text-subtle)] text-sm">
              <p>{t("footer.cookies")}</p>
              <span className="opacity-30">|</span>
              <Link
                href="/press"
                className="hover:text-[var(--color-text-muted)] transition-colors"
              >
                {t("footer.press")}
              </Link>
            </div>
            <p className="text-[var(--color-text-subtle)] text-[10px] opacity-50">
              GADEN ALPHA s.r.o. | IČO: 09949194 | DIČ: CZ09949194 | Polní 21, 252 64 Velké Přílepy
              | Zapsáno u MS v Praze, C 345227
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
