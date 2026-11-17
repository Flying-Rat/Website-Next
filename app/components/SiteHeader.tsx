'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useScrolledPast } from '../hooks/useScrollFrame';
import { useTranslation } from '../i18n';
import { HeaderControls, MenuToggle } from './HeaderControls';
import { ExternalLinkIcon } from './icons';

export type HeaderLink = { href: string; label: string };

const MENU_ID = 'site-menu';

function NavLink({
  link,
  className,
  iconClassName,
  onClick,
}: {
  link: HeaderLink;
  className: string;
  iconClassName: string;
  onClick?: () => void;
}) {
  const isExternal = link.href.startsWith('http');

  return (
    <a
      href={link.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={className}
      onClick={onClick}
    >
      {link.label}
      {isExternal && <ExternalLinkIcon className={iconClassName} />}
    </a>
  );
}

export function SiteHeader({
  brand,
  links,
  navLabel,
}: {
  brand: ReactNode;
  links: HeaderLink[];
  navLabel: string;
}) {
  const { t } = useTranslation();
  const isScrolled = useScrolledPast(24);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        // The panel is inert once closed; hand focus back to the button that opened it.
        document.querySelector<HTMLElement>(`[aria-controls="${MENU_ID}"]`)?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 border-b ${isScrolled ? 'glass py-3' : 'border-transparent py-5'}`}
    >
      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 -z-10 cursor-default md:hidden"
          aria-hidden="true"
          tabIndex={-1}
          onClick={closeMenu}
        />
      )}
      <div className="container flex items-center justify-between">
        {brand}

        <div className="hidden items-center gap-5 md:flex lg:gap-9">
          <nav aria-label={navLabel} className="flex items-center gap-5 lg:gap-9">
            {links.map((link) => (
              <NavLink
                key={link.href}
                link={link}
                // Padding the box, not the text: the links keep their place and gain a finger-sized target.
                className="-my-3 flex items-center gap-1 py-3 text-sm whitespace-nowrap text-muted transition-colors hover:text-ink"
                iconClassName="size-2.5 opacity-60"
              />
            ))}
          </nav>
          <div className="border-l border-line pl-3 lg:pl-5">
            <HeaderControls />
          </div>
        </div>

        <MenuToggle
          open={isMenuOpen}
          controls={MENU_ID}
          label={t('nav.toggleMenu')}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
        />
      </div>

      <div
        id={MENU_ID}
        // Closed, the panel is only collapsed, not removed: keep its links out of
        // the tab order and away from screen readers.
        inert={!isMenuOpen}
        className={`surface-card mx-4 overflow-hidden transition-all duration-300 ease-smooth md:hidden ${isMenuOpen ? 'mt-3 max-h-[70vh] p-5 opacity-100' : 'mt-0 max-h-0 border-transparent p-0 opacity-0'}`}
      >
        <nav aria-label={navLabel} className="flex flex-col">
          {links.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              className="font-display flex min-h-12 items-center gap-2 text-xl font-medium text-ink"
              iconClassName="size-3 opacity-50"
              onClick={closeMenu}
            />
          ))}
          <div className="mt-3 border-t border-line pt-2">
            <HeaderControls touch onLanguageChange={closeMenu} />
          </div>
        </nav>
      </div>
    </header>
  );
}
