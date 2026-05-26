'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

import { projects } from '../data/projects';
import { useLanguage, useTranslation } from '../i18n';
import { renderSimpleMarkdown } from '../utils/renderSimpleMarkdown';
import { FadeInView } from './FadeInView';
import { PlatformIcon } from './icons';

const PRIVACY_POLICY_HREF = '/games/privacy-policy';

const privacyCalloutCopy = {
  en: {
    label: 'Policy & Data',
    title: 'Telemetry, analytics, and player data practices for our games.',
    cta: 'Privacy Policy',
  },
  cs: {
    label: 'Zasady a data',
    title: 'Jak v nasich hrach pracujeme s telemetrii, analytikou a daty hracu.',
    cta: 'Zasady ochrany soukromi',
  },
} as const;

export const Projects = () => {
  const [currentLang] = useLanguage();
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const privacyCopy = privacyCalloutCopy[currentLang];
  const translate = useCallback((key: string) => t(key, { lng: currentLang }), [t, currentLang]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section id="projects" className="section-pad bg-[var(--color-surface)] relative">
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full pattern-dots" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <FadeInView animation="up" className="text-center mb-10 md:mb-16">
            <h2 className="section-title mb-3 md:mb-4">{translate('projects.title')}</h2>
            <p className="section-subtitle max-w-2xl mx-auto">{translate('projects.subtitle')}</p>
          </FadeInView>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                isExpanded={expandedId === project.id}
                onToggle={toggleExpand}
                t={translate}
                currentLang={currentLang}
              />
            ))}
          </div>

          <FadeInView animation="scale" delay={0.2} margin="-30px" className="mt-5 md:mt-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/55 backdrop-blur-sm">
              <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                <div className="min-w-0 sm:pr-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                    <span className="h-px w-4 bg-accent/60" />
                    <span>{privacyCopy.label}</span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm text-[var(--color-text-secondary)] md:text-[15px]">
                    {privacyCopy.title}
                  </p>
                </div>
                <Link
                  href={PRIVACY_POLICY_HREF}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)] sm:w-auto"
                >
                  {privacyCopy.cta}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="size-3.5 text-accent"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.5 8h9m0 0-3-3m3 3-3 3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
};

interface ProjectCardProps {
  project: (typeof projects)[0];
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  t: (key: string) => string;
  currentLang: 'en' | 'cs';
}

const ProjectCard = memo(function ProjectCard({
  project,
  index,
  isExpanded,
  onToggle,
  t,
  currentLang,
}: ProjectCardProps) {
  const descriptionId = `${project.id}-description`;

  return (
    <FadeInView animation="scale" delay={index * 0.06} margin="-30px">
      <article className="project-card relative bg-[var(--color-surface)] rounded-xl sm:rounded-2xl overflow-hidden group border border-[var(--color-border)] h-full">
        <button
          type="button"
          className="block w-full text-left cursor-pointer"
          onClick={() => onToggle(project.id)}
          aria-expanded={isExpanded}
          aria-controls={project.description ? descriptionId : undefined}
        >
          <div className="project-image-frame aspect-video bg-[var(--color-surface-light)] relative overflow-hidden">
            <div className="project-image-layer absolute -inset-1 transition-transform duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025] will-change-transform">
              {project.image ? (
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl">🧀</span>
                    <p className="text-xs text-[var(--color-text-subtle)] mt-2">
                      {t('projects.comingSoon')}
                    </p>
                  </div>
                </div>
              )}
              <div className="project-image-wash pointer-events-none absolute" />
            </div>

            {project.isInternal && (
              <div className="project-internal-badge absolute top-2 right-2 z-10 sm:top-3 sm:right-3 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-accent text-[10px] sm:text-xs font-semibold rounded">
                {t('projects.internal')}
              </div>
            )}
          </div>

          <div className="project-card-body p-3 pt-4 pb-3 sm:p-4 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold leading-tight mb-1 group-hover:text-accent transition-colors truncate">
                  {project.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-[var(--color-text-subtle)] truncate">
                  {project.studio}
                </p>
              </div>
              <div
                className={`mt-0.5 shrink-0 text-[var(--color-text-subtle)] transition-transform duration-200 ${isExpanded ? 'rotate-180 text-accent' : ''}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </button>

        <div className="project-platform-footer px-3 pt-2.5 pb-3 sm:px-4 sm:pt-3 sm:pb-4">
          <fieldset className="flex flex-wrap gap-1.5" aria-label="Platforms">
            {project.platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-badge project-platform-badge"
                title={`${project.title} on ${platform.name}`}
              >
                <PlatformIcon name={platform.name} />
                <span className="hidden sm:inline">{platform.name}</span>
              </a>
            ))}
            {project.isInternal && project.platforms.length === 0 && (
              <span className="platform-badge project-platform-badge">🔜 {t('projects.tba')}</span>
            )}
          </fieldset>
        </div>

        {project.description && isExpanded && (
          <div
            id={descriptionId}
            className="project-detail-overlay flex min-h-0 flex-col absolute inset-0 z-20 overflow-hidden p-3 sm:p-4"
            role="region"
            aria-label={`${project.title} details`}
          >
            <button
              type="button"
              className="project-detail-close absolute right-3 top-3 sm:right-4 sm:top-4"
              onClick={() => onToggle(project.id)}
              aria-label={`Close ${project.title} details`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 5l10 10M15 5 5 15" />
              </svg>
            </button>

            <div className="project-detail-copy min-h-0 flex-1">
              <div className="max-w-[calc(100%-2.75rem)] sm:max-w-[calc(100%-2.5rem)]">
                <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                  {project.studio}
                </p>
                <h3 className="mt-1 text-sm font-semibold leading-tight text-[var(--color-text)] sm:text-base">
                  {project.title}
                </h3>
              </div>

              <p className="mt-3 text-xs leading-snug text-pretty text-[var(--color-text-secondary)] sm:mt-4 sm:text-sm sm:leading-relaxed">
                {renderSimpleMarkdown(project.description[currentLang])}
              </p>
            </div>
          </div>
        )}
      </article>
    </FadeInView>
  );
});
