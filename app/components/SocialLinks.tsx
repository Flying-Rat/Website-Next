import { socialLinks } from './icons';

export function SocialLinks() {
  return (
    <div className="grid grid-cols-[repeat(4,2.5rem)] gap-2 sm:flex sm:flex-wrap">
      {socialLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          className="group flex size-10 items-center justify-center rounded-full border border-line transition-colors duration-200 hover:border-ink hover:bg-ink"
          title={link.name}
          aria-label={link.name}
        >
          <link.Icon className="size-4 text-muted transition-colors duration-200 group-hover:text-page" />
        </a>
      ))}
    </div>
  );
}
