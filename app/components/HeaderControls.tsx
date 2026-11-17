'use client';

import { useTheme } from '../hooks/useTheme';
import { languages, useLanguage, useTranslation } from '../i18n';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

export function HeaderControls({
  onLanguageChange,
  touch = false,
}: {
  onLanguageChange?: () => void;
  /** Finger-sized targets, for the mobile menu. */
  touch?: boolean;
}) {
  const { t } = useTranslation();
  const [currentLang, setLanguage] = useLanguage();
  const { theme, cycleTheme, mounted } = useTheme();

  return (
    <div className={`flex items-center ${touch ? 'justify-between' : 'gap-2'}`}>
      <div
        role="group"
        aria-label={t('nav.language')}
        className={`flex items-center font-mono ${touch ? '-ml-3 text-sm' : 'text-xs'}`}
      >
        {languages.map((lang, index) => (
          <span key={lang} className="flex items-center">
            {index > 0 && (
              <span className="text-subtle" aria-hidden="true">
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setLanguage(lang);
                onLanguageChange?.();
              }}
              aria-pressed={currentLang === lang}
              lang={lang}
              className={`${touch ? 'min-h-11 min-w-11 px-3' : 'px-1.5 py-1'} cursor-pointer uppercase transition-colors ${
                currentLang === lang ? 'text-ink' : 'text-subtle hover:text-ink'
              }`}
            >
              {lang}
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={cycleTheme}
        className={`flex ${touch ? '-mr-3 size-11' : 'size-8'} cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-light hover:text-ink`}
        aria-label={t('nav.toggleTheme')}
      >
        {mounted &&
          (theme === 'dark' ? (
            <MoonIcon className="size-4" />
          ) : theme === 'system' ? (
            <MonitorIcon className="size-4" />
          ) : (
            <SunIcon className="size-4" />
          ))}
      </button>
    </div>
  );
}

export function MenuToggle({
  open,
  label,
  controls,
  onToggle,
}: {
  open: boolean;
  label: string;
  controls: string;
  onToggle: () => void;
}) {
  const bar = 'absolute left-0 h-[1.5px] w-full bg-ink transition-all duration-300';

  return (
    <button
      type="button"
      className="-my-1.5 -mr-2.5 flex size-11 shrink-0 cursor-pointer items-center justify-center md:hidden"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={open}
      aria-controls={controls}
    >
      <span className="relative block h-3 w-6">
        <span className={`${bar} ${open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'}`} />
        <span className={`${bar} ${open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0'}`} />
      </span>
    </button>
  );
}
