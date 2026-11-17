'use client';

import { useTranslation } from '../i18n';
import { FadeInView } from './FadeInView';
import { ExternalLinkIcon, MailIcon } from './icons';

const EVENT_EMAIL = 'marty+events@flying-rat.studio';

/** Each dot wears its organisation's own colour; our own events keep coral. */
const items = [
  { key: 'gda', href: 'https://gda.cz/', label: 'gda.cz', dot: 'bg-gda' },
  { key: 'bnf', href: 'https://bnf.events/', label: 'bnf.events', dot: 'bg-bonfire' },
  { key: 'dekoder', href: 'https://dekoder.fm/', label: 'dekoder.fm', dot: 'bg-dekoder' },
  { key: 'events', href: `mailto:${EVENT_EMAIL}`, label: EVENT_EMAIL, dot: 'bg-accent' },
];

export function Community() {
  const { t } = useTranslation();

  return (
    <section id="community" className="relative py-14 md:py-20">
      <div className="container">
        <FadeInView margin="-60px">
          <div className="mb-8 flex items-center gap-5 md:mb-10">
            <h2 className="font-display shrink-0 text-xl font-semibold md:text-2xl">
              {t('community.title')}
            </h2>
            <span className="h-px flex-1 bg-line" />
          </div>

          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(({ key, href, label, dot }) => {
              const isMail = href.startsWith('mailto:');
              const Icon = isMail ? MailIcon : ExternalLinkIcon;
              return (
                <li key={key}>
                  <a
                    href={href}
                    target={isMail ? undefined : '_blank'}
                    rel={isMail ? undefined : 'noopener noreferrer'}
                    className="group block"
                  >
                    <span className="eyebrow flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${dot}`} />
                      {t(`community.items.${key}.tag`)}
                    </span>
                    <span className="font-display mt-3 block text-xl font-semibold transition-colors duration-300 group-hover:text-accent-ink">
                      {t(`community.items.${key}.name`)}
                    </span>
                    <span className="mt-1.5 block max-w-[17rem] text-md leading-relaxed text-pretty text-muted">
                      {t(`community.items.${key}.body`)}
                    </span>
                    <span className="mt-3 flex items-center gap-1.5 font-mono text-xs text-subtle transition-colors duration-300 group-hover:text-ink">
                      {label}
                      <Icon className={isMail ? 'size-3.5' : 'size-2.5'} />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </FadeInView>
      </div>
    </section>
  );
}
