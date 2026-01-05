"use client";

import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTheme } from "../hooks/useTheme";
import { useLanguage, useTranslation } from "../i18n";
import { ExternalLinkIcon, MoonIcon, SunIcon } from "./icons";
import { M } from "./Motion";

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
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldAnimate = useAnimationsEnabled();

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

  return (
    <M.header
      className={`fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 ${isScrolled ? "glass py-3" : "py-6"}`}
      initial={shouldAnimate ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={shouldAnimate ? { duration: 0.6, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
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
          {navSections.map((item, index) => {
            const isExternal = item.href.startsWith("http");
            return (
              <M.a
                key={item.href}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors relative group flex items-center gap-1"
                initial={shouldAnimate ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldAnimate ? { duration: 0.4, delay: 0.1 + index * 0.05 } : { duration: 0 }
                }
                whileHover={shouldAnimate ? { y: -2 } : undefined}
              >
                {t(item.key)}
                {isExternal && <ExternalLinkIcon className="w-2.5 h-2.5 opacity-50" />}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
              </M.a>
            );
          })}

          <M.div
            className="flex items-center gap-3 ml-4 border-l border-[var(--color-border-hover)] pl-4 text-sm text-[var(--color-text-muted)]"
            initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={shouldAnimate ? { duration: 0.4, delay: 0.4 } : { duration: 0 }}
          >
            <div className="flex items-center">
              <M.button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-1.5 py-1 rounded transition-colors ${currentLang === "en" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              >
                EN
              </M.button>
              <span className="opacity-30">|</span>
              <M.button
                type="button"
                onClick={() => setLanguage("cs")}
                className={`px-1.5 py-1 rounded transition-colors ${currentLang === "cs" ? "text-[var(--color-text)]" : "hover:text-[var(--color-text)]"}`}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              >
                CS
              </M.button>
            </div>
            <M.button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-colors"
              aria-label="Toggle theme"
              whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
            >
              {mounted &&
                (resolvedTheme === "dark" ? (
                  <SunIcon className="w-4 h-4" />
                ) : (
                  <MoonIcon className="w-4 h-4" />
                ))}
            </M.button>
          </M.div>
        </nav>

        <button
          type="button"
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t("nav.toggleMenu")}
          aria-expanded={isMobileMenuOpen}
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <M.span
              className="w-full h-0.5 bg-[var(--color-text)]"
              animate={isMobileMenuOpen ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
              transition={shouldAnimate ? { duration: 0.2 } : { duration: 0 }}
            />
            <M.span
              className="w-full h-0.5 bg-[var(--color-text)]"
              animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={shouldAnimate ? { duration: 0.2 } : { duration: 0 }}
            />
            <M.span
              className="w-full h-0.5 bg-[var(--color-text)]"
              animate={isMobileMenuOpen ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
              transition={shouldAnimate ? { duration: 0.2 } : { duration: 0 }}
            />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <M.div
            className="md:hidden glass mt-2 mx-4 rounded-lg p-4 overflow-hidden"
            initial={shouldAnimate ? { opacity: 0, height: 0 } : { opacity: 1, height: "auto" }}
            animate={{ opacity: 1, height: "auto" }}
            exit={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
            transition={
              shouldAnimate ? { duration: 0.3, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }
            }
          >
            <nav className="flex flex-col gap-4">
              {navSections.map((item, index) => {
                const isExternal = item.href.startsWith("http");
                return (
                  <M.a
                    key={item.href}
                    href={item.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors py-2 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                    initial={shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={
                      shouldAnimate ? { duration: 0.3, delay: index * 0.05 } : { duration: 0 }
                    }
                  >
                    {t(item.key)}
                    {isExternal && <ExternalLinkIcon className="w-2.5 h-2.5 opacity-50" />}
                  </M.a>
                );
              })}
              <M.div
                className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-hover)] text-sm text-[var(--color-text-muted)]"
                initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={shouldAnimate ? { duration: 0.3, delay: 0.2 } : { duration: 0 }}
              >
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
                  {mounted &&
                    (resolvedTheme === "dark" ? (
                      <SunIcon className="w-4 h-4" />
                    ) : (
                      <MoonIcon className="w-4 h-4" />
                    ))}
                </button>
              </M.div>
            </nav>
          </M.div>
        )}
      </AnimatePresence>
    </M.header>
  );
}
