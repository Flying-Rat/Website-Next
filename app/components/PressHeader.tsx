"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTheme } from "../hooks/useTheme";
import { useLanguage, useTranslation } from "../i18n";
import { MoonIcon, SunIcon } from "./icons";

type PressNavItem = {
  id: string;
  label: string;
};

type PressHeaderProps = {
  navItems: PressNavItem[];
};

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export function PressHeader({ navItems }: PressHeaderProps) {
  const { t } = useTranslation();
  const [currentLang, setLanguage] = useLanguage();
  const { resolvedTheme, toggleTheme, mounted: themeMounted } = useTheme();
  const shouldAnimate = useAnimationsEnabled();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerMounted, setHeaderMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeaderMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let frame = 0;
    let current = false;

    const update = () => {
      frame = 0;
      const next = window.scrollY > 50;
      if (next !== current) {
        current = next;
        setIsScrolled(next);
      }
    };

    const onScroll = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const headerStyle = shouldAnimate
    ? {
        opacity: headerMounted ? 1 : 0,
        transform: headerMounted ? "none" : "translateY(-100%)",
        transition:
          "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }
    : undefined;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 ${isScrolled ? "glass py-3" : "py-6"}`}
      style={headerStyle}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>{t("pressKit.backHome")}</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <nav>
            <ul className="flex items-center gap-8 text-sm">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-all relative group flex items-center gap-1 hover:-translate-y-0.5"
                    href={`#${item.id}`}
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] border-l border-[var(--color-border-hover)] pl-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-1.5 py-1 rounded transition-all active:scale-95 cursor-pointer ${currentLang === "en" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
              >
                EN
              </button>
              <span className="opacity-30">|</span>
              <button
                type="button"
                onClick={() => setLanguage("cs")}
                className={`px-1.5 py-1 rounded transition-all active:scale-95 cursor-pointer ${currentLang === "cs" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
              >
                CS
              </button>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-all hover:scale-110 active:scale-90 cursor-pointer"
              aria-label={t("pressKit.toggleTheme")}
            >
              {themeMounted &&
                (resolvedTheme === "dark" ? (
                  <SunIcon className="w-4 h-4" />
                ) : (
                  <MoonIcon className="w-4 h-4" />
                ))}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t("nav.toggleMenu")}
          aria-expanded={isMobileMenuOpen}
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <span
              className={`w-full h-0.5 bg-[var(--color-text)] transition-all duration-200 origin-center ${isMobileMenuOpen ? "rotate-45 translate-y-[9px]" : ""}`}
            />
            <span
              className={`w-full h-0.5 bg-[var(--color-text)] transition-all duration-200 ${isMobileMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`w-full h-0.5 bg-[var(--color-text)] transition-all duration-200 origin-center ${isMobileMenuOpen ? "-rotate-45 -translate-y-[9px]" : ""}`}
            />
          </div>
        </button>
      </div>

      <div
        className={`md:hidden glass mt-2 mx-4 rounded-lg overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? "max-h-[70vh] opacity-100 p-4" : "max-h-0 opacity-0 p-0"}`}
      >
        <nav className="flex flex-col gap-4">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors py-2 flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-hover)] text-sm text-[var(--color-text-muted)]">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setIsMobileMenuOpen(false);
                }}
                className={`px-1.5 py-1 rounded transition-colors cursor-pointer ${currentLang === "en" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
              >
                EN
              </button>
              <span className="opacity-30">|</span>
              <button
                type="button"
                onClick={() => {
                  setLanguage("cs");
                  setIsMobileMenuOpen(false);
                }}
                className={`px-1.5 py-1 rounded transition-colors cursor-pointer ${currentLang === "cs" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
              >
                CS
              </button>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-colors cursor-pointer"
              aria-label={t("pressKit.toggleTheme")}
            >
              {themeMounted &&
                (resolvedTheme === "dark" ? (
                  <SunIcon className="w-4 h-4" />
                ) : (
                  <MoonIcon className="w-4 h-4" />
                ))}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
