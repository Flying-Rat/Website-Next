"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { useLanguage, useTranslation } from "../i18n";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Light Mode</title>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Dark Mode</title>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function FlagEN({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 18" fill="none">
      <title>English</title>
      <rect width="24" height="18" rx="2" fill="#B22234" />
      <path d="M0 2H24M0 5H24M0 8H24M0 11H24M0 14H24M0 17H24" stroke="#fff" strokeWidth="1.5" />
      <path d="M0 0H12V9H0V0Z" fill="#3C3B6E" />
      <path
        d="M6 1.5L6.5 2.5L7.5 2.5L6.8 3.2L7.1 4.2L6 3.6L4.9 4.2L5.2 3.2L4.5 2.5L5.5 2.5L6 1.5Z"
        fill="#fff"
        transform="scale(0.8) translate(1, 1)"
      />
    </svg>
  );
}

function FlagCS({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 18" fill="none">
      <title>Czech</title>
      <rect width="24" height="18" fill="#D7141A" rx="2" />
      <rect width="24" height="9" fill="#fff" />
      <path d="M0 0L12 9L0 18V0Z" fill="#11457E" />
    </svg>
  );
}

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
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass py-3" : "py-6"}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
              <motion.a
                key={item.href}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors relative group flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -2 }}
              >
                {t(item.key)}
                {isExternal && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-50"
                  >
                    <title>External Link</title>
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
              </motion.a>
            );
          })}

          <motion.div
            className="flex items-center gap-1 ml-4 border-l border-[var(--color-border-hover)] pl-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <motion.button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-colors"
              aria-label="Toggle theme"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {mounted &&
                (resolvedTheme === "dark" ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                ))}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setLanguage(currentLang === "en" ? "cs" : "en")}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-colors"
              aria-label="Toggle language"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {currentLang === "en" ? (
                <FlagEN className="w-5 h-4" />
              ) : (
                <FlagCS className="w-5 h-4" />
              )}
            </motion.button>
          </motion.div>
        </nav>

        <button
          type="button"
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t("nav.toggleMenu")}
          aria-expanded={isMobileMenuOpen}
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <motion.span
              className="w-full h-0.5 bg-[var(--color-text)]"
              animate={isMobileMenuOpen ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="w-full h-0.5 bg-[var(--color-text)]"
              animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="w-full h-0.5 bg-[var(--color-text)]"
              animate={isMobileMenuOpen ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden glass mt-2 mx-4 rounded-lg p-4 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav className="flex flex-col gap-4">
              {navSections.map((item, index) => {
                const isExternal = item.href.startsWith("http");
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors py-2 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {t(item.key)}
                    {isExternal && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-50"
                      >
                        <title>External Link</title>
                        <path d="M7 17l9.2-9.2M17 17V7H7" />
                      </svg>
                    )}
                  </motion.a>
                );
              })}
              <motion.div
                className="flex items-center gap-1 pt-4 border-t border-[var(--color-border-hover)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-colors"
                  aria-label="Toggle theme"
                >
                  {mounted &&
                    (resolvedTheme === "dark" ? (
                      <SunIcon className="w-5 h-5" />
                    ) : (
                      <MoonIcon className="w-5 h-5" />
                    ))}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(currentLang === "en" ? "cs" : "en");
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)] transition-colors"
                  aria-label="Toggle language"
                >
                  {currentLang === "en" ? (
                    <FlagEN className="w-5 h-4" />
                  ) : (
                    <FlagCS className="w-5 h-4" />
                  )}
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
