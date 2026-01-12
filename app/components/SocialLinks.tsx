"use client";

import { socialLinks } from "./icons";

type SocialLinksProps = {
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
};

export function SocialLinks({
  className = "flex flex-wrap justify-center gap-4",
  linkClassName = "w-12 h-12 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-xl flex items-center justify-center transition-all group hover:scale-110 hover:-translate-y-0.5 active:scale-95",
  iconClassName = "w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors",
}: SocialLinksProps) {
  return (
    <div className={className}>
      {socialLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          className={linkClassName}
          title={link.name}
          aria-label={link.name}
        >
          <link.Icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
