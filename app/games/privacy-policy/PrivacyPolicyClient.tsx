'use client';

import { ExternalLinkIcon } from '../../components/icons';
import { SecondaryPageShell } from '../../components/SecondaryPageShell';
import { useLanguage } from '../../i18n';
import { pad2 } from '../../utils/pad2';
import { type PolicyBlock, type PolicySection, privacyPolicyCopy } from './privacyPolicyCopy';

function PolicyLink({ href, children }: { href: string; children: string }) {
  const isExternal = href.startsWith('http');
  return (
    <a
      href={href}
      className="text-link"
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  );
}

function Block({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case 'p':
      return <p>{block.text}</p>;
    case 'h3':
      return <h3 className="font-display pt-4 text-lg font-semibold text-ink">{block.text}</h3>;
    case 'list':
      return (
        <ul className="space-y-2.5">
          {block.items.map((item) => (
            <li
              key={item}
              className="relative pl-6 before:absolute before:top-[0.8em] before:left-0 before:h-px before:w-3 before:bg-accent"
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case 'details':
      return (
        <dl className="border-t border-line">
          {block.rows.map((row) => (
            <div
              key={row.label}
              className="grid gap-1 border-b border-line py-3 sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-6"
            >
              <dt className="eyebrow">{row.label}</dt>
              <dd className="break-words text-ink">
                {row.href ? <PolicyLink href={row.href}>{row.value}</PolicyLink> : row.value}
              </dd>
            </div>
          ))}
        </dl>
      );
    case 'links':
      return (
        <ul className="space-y-2.5">
          {block.items.map((item) => (
            <li key={item.href} className="flex items-center gap-1.5">
              <PolicyLink href={item.href}>{item.label}</PolicyLink>
              <ExternalLinkIcon className="size-3 text-subtle" />
            </li>
          ))}
        </ul>
      );
  }
}

function Section({ section, index }: { section: PolicySection; index: number }) {
  return (
    <section id={section.id} className="scroll-mt-24 border-t border-line py-10 md:py-12">
      <h2 className="font-display flex items-baseline gap-4 text-2xl font-semibold md:text-[1.75rem]">
        <span className="font-mono text-xs font-normal tracking-normal text-accent-ink">
          {pad2(index + 1)}
        </span>
        {section.title}
      </h2>
      <div className="mt-5 space-y-4 leading-7 text-secondary md:pl-9">
        {section.blocks.map((block, blockIndex) => (
          // oxlint-disable-next-line react/no-array-index-key -- static copy, never reordered
          <Block key={blockIndex} block={block} />
        ))}
      </div>
    </section>
  );
}

export function PrivacyPolicyClient() {
  const [currentLang] = useLanguage();
  const copy = privacyPolicyCopy[currentLang];
  const navItems = copy.sections.flatMap((section) =>
    section.nav ? [{ id: section.id, label: section.nav }] : [],
  );

  return (
    <SecondaryPageShell navItems={navItems}>
      <article className="container pb-20 md:pb-28">
        <header className="max-w-3xl pt-6 md:pt-10">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="section-title mt-4">{copy.title}</h1>
          <p className="section-subtitle mt-5 max-w-2xl">{copy.description}</p>
          <p className="mt-6 flex flex-col gap-x-3 gap-y-1 font-mono text-xs text-subtle sm:flex-row">
            <span>{copy.updated}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              /
            </span>
            <span>{copy.published}</span>
          </p>
        </header>

        <div className="mt-12 md:mt-16 lg:grid lg:grid-cols-12 lg:gap-8">
          <nav aria-label={copy.contentsLabel} className="mb-12 lg:col-span-4 lg:mb-0">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">{copy.contentsLabel}</p>
              <ol className="mt-4 space-y-2.5 text-sm">
                {copy.sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="group flex items-baseline gap-3 text-muted transition-colors hover:text-ink"
                    >
                      <span className="font-mono text-xs text-subtle transition-colors group-hover:text-accent-ink">
                        {pad2(index + 1)}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="max-w-2xl border-b border-line lg:col-span-8">
            {copy.sections.map((section, index) => (
              <Section key={section.id} section={section} index={index} />
            ))}
          </div>
        </div>
      </article>
    </SecondaryPageShell>
  );
}
