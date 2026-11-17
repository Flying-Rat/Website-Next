'use client';

import Image from 'next/image';
import { useEffect } from 'react';

import { ContactSection } from '../components/ContactSection';
import { ArrowRightIcon, CheckIcon, LinkIcon, MapPinIcon } from '../components/icons';
import { LabelledList } from '../components/LabelledList';
import { SecondaryPageShell } from '../components/SecondaryPageShell';
import { SectionHeader } from '../components/SectionHeader';
import { useClipboard } from '../hooks/useClipboard';
import { useTranslation } from '../i18n';
import { HiringTimeline } from './HiringTimeline';

const sections = [
  {
    id: 'engineering',
    positions: [
      { key: 'cppMediorEngineer', level: 'medior' },
      { key: 'cppRustEngineer', level: 'senior' },
      { key: 'backendEngineer', level: 'medior' },
    ],
  },
  {
    id: 'qa',
    positions: [{ key: 'qaEngineer', level: 'medior' }],
  },
  {
    id: 'production',
    positions: [{ key: 'mediorProducer', level: 'medior' }],
  },
  {
    id: 'marketing',
    positions: [{ key: 'marketingManager', level: 'medior' }],
  },
  {
    id: 'it',
    positions: [{ key: 'juniorIt', level: 'junior' }],
  },
  {
    id: 'previously',
    positions: [
      { key: 'unrealEngineer', level: 'medior' },
      { key: 'unityEngineer', level: 'medior' },
      { key: 'pythonProgrammer', level: 'medior' },
      { key: 'officeCultureManager', level: 'medior' },
    ],
  },
];

function toAnchorId(sectionId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replaceAll('c++', 'cpp')
    .replaceAll('c#', 'csharp')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');
  return `${sectionId}-${slug}`;
}

export function JobsClient() {
  const { t } = useTranslation();
  const email = 'marty+jobs@flying-rat.studio';
  const { copied: copiedId, copy: copyLink } = useClipboard<string>();

  const jobsNavItems = sections
    .filter((section) => section.id !== 'previously')
    .map((section) => ({
      id: section.id,
      label: t(`jobs.sections.${section.id}`),
    }));
  const hiringSteps = t('jobs.hiringProcess.steps', {
    returnObjects: true,
  }) as { title: string; description: string }[];

  const handleCopyLink = async (anchorId: string) => {
    const url = `${window.location.origin}/jobs#${anchorId}`;
    await copyLink(anchorId, url);
  };

  const getMailtoUrl = (positionTitle: string) => {
    const subject = encodeURIComponent(`Application: ${positionTitle}`);
    return `mailto:${email}?subject=${subject}`;
  };

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    const id = window.location.hash.slice(1);
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    // No explicit behaviour: the stylesheet decides, smooth unless motion is reduced.
    const timeoutId = setTimeout(() => element.scrollIntoView(), 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const perks = t('jobs.perks', { returnObjects: true }) as string[];

  return (
    <SecondaryPageShell navItems={jobsNavItems}>
      <div className="jobs-intro">
        <figure className="jobs-crew">
          <div className="jobs-crew-frame">
            <Image
              src="/images/team-2.webp"
              alt={t('jobs.team.imageAlt')}
              fill
              className="jobs-crew-image"
              sizes="(max-width: 1023px) 100vw, 56vw"
              preload
            />
          </div>
          <figcaption className="px-6 pt-3 font-mono text-xs text-subtle lg:px-0">
            {t('jobs.team.caption')}
          </figcaption>
        </figure>

        <div className="container">
          <div className="pt-9 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:py-6">
            <div className="lg:col-span-5">
              <p className="eyebrow flex items-center gap-2">
                <MapPinIcon className="size-3.5" />
                {t('jobs.location')}
              </p>
              <h1 className="section-title cta-title mt-4">{t('jobs.title')}</h1>
              <p className="mt-6 text-lg leading-snug text-pretty text-ink sm:text-xl lg:mt-8">
                {t('jobs.subtitle.intro')}
              </p>
              <p className="mt-4 text-pretty text-muted sm:text-lg">{t('jobs.subtitle.culture')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <LabelledList label={t('jobs.perksLabel')} items={perks} className="pt-8" />
      </div>

      <section className="section-pad">
        <div className="container">
          <SectionHeader
            title={t('jobs.hiringProcess.title')}
            subtitle={t('jobs.hiringProcess.description')}
          />

          <HiringTimeline steps={hiringSteps} email={email} martyAlt={t('jobs.martyAlt')} />

          <p className="mx-auto mt-10 max-w-4xl text-center text-sm text-subtle">
            {t('jobs.hiringProcess.note')}
          </p>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container">
          <SectionHeader title={t('jobs.openRoles.title')} subtitle={t('jobs.status')} />

          {sections.map((section) => {
            const isPast = section.id === 'previously';
            return (
              <section
                key={section.id}
                id={section.id}
                className={`grid scroll-mt-24 gap-6 border-t border-line py-10 lg:grid-cols-12 lg:gap-8 ${
                  // Past roles are faded to show they are closed; hovering or tabbing into
                  // them brings the text back to full contrast for anyone who wants to read it.
                  isPast
                    ? 'opacity-55 transition-opacity duration-300 focus-within:opacity-100 hover:opacity-100'
                    : ''
                }`}
              >
                <div className="lg:col-span-3">
                  <h3 className="font-display text-2xl font-semibold lg:sticky lg:top-28">
                    {t(`jobs.sections.${section.id}`)}
                  </h3>
                </div>

                <div className="space-y-4 lg:col-span-9">
                  {section.positions.map((position) => {
                    const title = t(`jobs.positions.${position.key}.title`);
                    const anchorId = toAnchorId(section.id, title);
                    const points = t(`jobs.positions.${position.key}.points`, {
                      returnObjects: true,
                    }) as string[];

                    return (
                      <article
                        key={position.key}
                        id={anchorId}
                        className="job-card surface-card scroll-mt-28 p-5 sm:p-8 lg:p-10"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="eyebrow flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="text-ink">{t(`jobs.levels.${position.level}`)}</span>
                            <span aria-hidden="true">/</span>
                            <span>{t('jobs.location')}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(anchorId)}
                            className="-m-3 shrink-0 cursor-pointer rounded-full p-3 transition-colors hover:bg-surface-light"
                            title={t('jobs.copyLink')}
                            // The only feedback is an icon swap, so the name carries it too.
                            aria-label={
                              copiedId === anchorId ? t('jobs.linkCopied') : t('jobs.copyLink')
                            }
                          >
                            {copiedId === anchorId ? (
                              <CheckIcon className="size-4 text-online-ink" />
                            ) : (
                              <LinkIcon className="size-4 text-subtle" />
                            )}
                          </button>
                        </div>

                        <h4 className="font-display mt-4 text-2xl leading-[1.05] font-semibold text-balance sm:text-[1.75rem] md:text-4xl">
                          {title}
                        </h4>

                        <p className="mt-5 max-w-3xl text-md leading-relaxed text-pretty text-secondary sm:mt-6 sm:text-[17px]">
                          {t(`jobs.positions.${position.key}.description`)}
                        </p>

                        {/* Past roles drop their requirement list on small screens to keep the page short. */}
                        <ul
                          className={`mt-5 gap-x-10 sm:mt-7 sm:grid sm:grid-cols-2 ${isPast ? 'hidden' : 'grid'}`}
                        >
                          {points.map((point) => (
                            <li
                              key={point}
                              className="border-t border-line py-2.5 text-sm text-muted sm:py-3 sm:text-md"
                            >
                              {point}
                            </li>
                          ))}
                        </ul>

                        {/* The address stays visible in case no mail app opens. */}
                        <a
                          href={getMailtoUrl(title)}
                          className="group mt-6 flex items-center justify-between gap-6 border-t border-line pt-5 sm:mt-8 sm:pt-6"
                        >
                          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="font-display text-xl font-semibold text-balance sm:text-2xl">
                              {t('jobs.apply')}
                              <span className="sr-only">: {title}</span>
                            </span>
                            {/* Zero intrinsic width, so a long address is cut short on a narrow
                                phone and never widens the page. */}
                            <span className="w-0 min-w-full truncate font-mono text-xs text-subtle transition-colors duration-300 group-hover:text-ink">
                              {email}
                            </span>
                          </span>
                          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-colors duration-300 group-hover:bg-ink group-hover:text-page sm:size-12">
                            <ArrowRightIcon className="size-4 transition-transform duration-300 ease-smooth group-hover:translate-x-0.5" />
                          </span>
                        </a>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <ContactSection
        titleKey="jobs.contact.title"
        descriptionKey="jobs.contact.description"
        martyAltKey="jobs.martyAlt"
        email={email}
      />
    </SecondaryPageShell>
  );
}
