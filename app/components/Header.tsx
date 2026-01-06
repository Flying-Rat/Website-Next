"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTheme } from "../hooks/useTheme";
import { useLanguage, useTranslation } from "../i18n";
import { ExternalLinkIcon, MoonIcon, SunIcon } from "./icons";

const navSections = [
  { href: "#about", key: "nav.about" },
  { href: "#what-we-do", key: "nav.whatWeDo" },
  { href: "#projects", key: "nav.projects" },
  { href: "#contact", key: "nav.contact" },
  { href: "https://tech.flying-rat.studio/", key: "nav.blog" },
];

export function Header() {
  const [currentLang, setLanguage] = useLanguage();
  const { t } = useTranslation();
  const { resolvedTheme, toggleTheme, mounted: themeMounted } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldAnimate = useAnimationsEnabled();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
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

  const headerStyle: CSSProperties = shouldAnimate
    ? {
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(-100%)",
        transition:
          "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }
    : {};

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 ${isScrolled ? "glass py-3" : "py-6"}`}
      style={headerStyle}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="/" className="group">
          <Image
            src="/fr_horizontal_black.png"
            alt="Flying Rat Studio"
            width={160}
            height={40}
            className="logo-dark h-8 md:h-10 w-auto"
            priority
          />
          <Image
            src="/fr_horizontal_white.png"
            alt="Flying Rat Studio"
            width={160}
            height={40}
            className="logo-light h-8 md:h-10 w-auto"
            priority
          />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navSections.map((item) => {
            const isExternal = item.href.startsWith("http");
            return (
              <a
                key={item.href}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-all relative group flex items-center gap-1 hover:-translate-y-0.5"
              >
                {t(item.key)}
                {isExternal && <ExternalLinkIcon className="w-2.5 h-2.5 opacity-50" />}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
              </a>
            );
          })}

          <div className="flex items-center gap-3 ml-4 border-l border-[var(--color-border-hover)] pl-4 text-sm text-[var(--color-text-muted)]">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-1.5 py-1 rounded transition-all active:scale-95 ${currentLang === "en" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
              >
                EN
              </button>
              <span className="opacity-30">|</span>
              <button
                type="button"
                onClick={() => setLanguage("cs")}
                className={`px-1.5 py-1 rounded transition-all active:scale-95 ${currentLang === "cs" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
              >
                CS
              </button>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-all hover:scale-110 active:scale-90"
              aria-label="Toggle theme"
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
        className={`md:hidden glass mt-2 mx-4 rounded-lg overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? "max-h-96 opacity-100 p-4" : "max-h-0 opacity-0 p-0"}`}
      >
        <nav className="flex flex-col gap-4">
          {navSections.map((item) => {
            const isExternal = item.href.startsWith("http");
            return (
              <a
                key={item.href}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors py-2 flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t(item.key)}
                {isExternal && <ExternalLinkIcon className="w-2.5 h-2.5 opacity-50" />}
              </a>
            );
          })}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-hover)] text-sm text-[var(--color-text-muted)]">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setIsMobileMenuOpen(false);
                }}
                className={`px-1.5 py-1 rounded transition-colors ${currentLang === "en" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
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
                className={`px-1.5 py-1 rounded transition-colors ${currentLang === "cs" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
              >
                CS
              </button>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-colors"
              aria-label="Toggle theme"
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
