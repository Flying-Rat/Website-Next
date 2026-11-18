'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useReducer, useRef, useState } from 'react';

import { type Project, projects } from '../data/projects';
import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { useInView } from '../hooks/useInView';
import { type Language, useLanguage, useTranslation } from '../i18n';
import { pad2 } from '../utils/pad2';
import { renderSimpleMarkdown } from '../utils/renderSimpleMarkdown';
import { FadeInView } from './FadeInView';
import { ArrowRightIcon, ExternalLinkIcon, PlatformIcon } from './icons';
import { SectionHeader } from './SectionHeader';

const PRIVACY_POLICY_HREF = '/games/privacy-policy';
/** From this width up, the detail sits beside the list; below it, it opens under the tapped row. */
const SIDE_BY_SIDE = '(min-width: 1024px)';
/** Covers the `.work-inline` height transition in globals.css, with a frame or two to spare. */
const ACCORDION_SETTLE_MS = 600;

interface ReelState {
  active: number;
  /** The project that was showing before, kept mounted underneath for the crossfade. */
  previous: number | null;
  /** Bumped on every change; keys the progress bar so its animation restarts. */
  tick: number;
  /** Small screens only: whether the active row's detail is expanded. */
  open: boolean;
}

type ReelAction = { type: 'select'; index: number } | { type: 'toggle' };

function reelReducer(state: ReelState, action: ReelAction): ReelState {
  if (action.type === 'toggle') {
    return { ...state, open: !state.open };
  }
  if (action.index === state.active) {
    return state.open ? state : { ...state, open: true };
  }
  return { active: action.index, previous: state.active, tick: state.tick + 1, open: true };
}

function handleRowKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return;
  }
  const list = event.currentTarget.closest('ul');
  const rows = [...(list?.querySelectorAll<HTMLElement>('.work-row-button') ?? [])];
  event.preventDefault();
  const offset = event.key === 'ArrowDown' ? 1 : -1;
  rows[(rows.indexOf(event.currentTarget) + offset + rows.length) % rows.length]?.focus();
}

export const Projects = () => {
  const [currentLang] = useLanguage();
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [reel, dispatch] = useReducer(reelReducer, {
    active: 0,
    previous: null,
    tick: 0,
    open: true,
  });
  const inView = useInView(sectionRef, { threshold: 0.2 });

  const activeProject = projects[reel.active];
  const previousProject = reel.previous === null ? null : projects[reel.previous];
  const nextProject = projects[(reel.active + 1) % projects.length];

  const handleRowClick = (event: React.MouseEvent<HTMLElement>, index: number) => {
    if (window.matchMedia(SIDE_BY_SIDE).matches) {
      dispatch({ type: 'select', index });
      return;
    }

    // Accordion. A row above may be collapsing; hold the tapped row still under the
    // finger for as long as it shrinks, not just for the first frame.
    const row = event.currentTarget;
    const anchor = row.getBoundingClientRect().top;
    const start = performance.now();
    dispatch(index === reel.active ? { type: 'toggle' } : { type: 'select', index });
    const hold = (now: number) => {
      const shift = row.getBoundingClientRect().top - anchor;
      if (Math.abs(shift) > 0.5) {
        window.scrollBy({ top: shift, behavior: 'instant' });
      }
      if (now - start < ACCORDION_SETTLE_MS) {
        requestAnimationFrame(hold);
      }
    };
    requestAnimationFrame(hold);
  };

  return (
    <section ref={sectionRef} id="projects" className="work section-pad">
      <div className="work-ambient" aria-hidden="true">
        {previousProject?.image && (
          <Image
            key={previousProject.id}
            src={previousProject.image}
            alt=""
            fill
            sizes="96px"
            className="work-ambient-image work-ambient-out"
          />
        )}
        {activeProject.image && (
          <Image
            key={activeProject.id}
            src={activeProject.image}
            alt=""
            fill
            sizes="96px"
            className="work-ambient-image work-ambient-in"
          />
        )}
      </div>

      <div className="relative container">
        <SectionHeader title={t('projects.title')} subtitle={t('projects.subtitle')} />

        <div className="work-reel lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
          <ul className="work-list lg:col-span-7">
            {projects.map((project, index) => {
              const isActive = index === reel.active;
              const isOpen = isActive && reel.open;

              return (
                <li key={project.id} className="work-row" data-active={isActive} data-open={isOpen}>
                  <button
                    type="button"
                    className="work-row-button"
                    aria-current={isActive ? 'true' : undefined}
                    aria-expanded={isOpen}
                    aria-controls={`work-panel-${project.id}`}
                    onClick={(event) => handleRowClick(event, index)}
                    onKeyDown={handleRowKeyDown}
                  >
                    <span className="work-index">{pad2(index + 1)}</span>
                    <span className="work-title">
                      {project.title}
                      {project.isInternal && (
                        <span className="work-badge">{t('projects.internal')}</span>
                      )}
                    </span>
                    <span className="work-studio">{project.studio}</span>
                    <span className="work-row-icon" aria-hidden="true">
                      <ArrowRightIcon className="work-row-arrow" />
                      <svg
                        className="work-row-plus"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      >
                        <path d="M10 4v12M4 10h12" />
                      </svg>
                    </span>
                  </button>

                  {isActive && shouldAnimate && inView && (
                    <span
                      key={reel.tick}
                      className="work-progress"
                      onAnimationEnd={() =>
                        dispatch({ type: 'select', index: (reel.active + 1) % projects.length })
                      }
                      aria-hidden="true"
                    />
                  )}

                  {/* Every panel stays mounted so it can open and close smoothly, and its
                      art, once loaded, is ready the next time the row is tapped. */}
                  <div
                    id={`work-panel-${project.id}`}
                    className="work-inline lg:hidden"
                    inert={!isOpen}
                  >
                    <div className="work-inline-body">
                      <ProjectDetail
                        project={project}
                        previous={null}
                        position={index}
                        lang={currentLang}
                        t={t}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-24">
              <ProjectDetail
                project={activeProject}
                previous={previousProject}
                position={reel.active}
                lang={currentLang}
                t={t}
              />
              {/* Warm the next key art so the reel never cuts to an empty screen. */}
              {nextProject.image && (
                <Image
                  key={`preload-${nextProject.id}`}
                  src={nextProject.image}
                  alt=""
                  width={616}
                  height={353}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="pointer-events-none absolute size-px opacity-0"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </div>

        <FadeInView margin="-30px" className="mt-12 md:mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">{t('projects.privacy.label')}</p>
              <p className="mt-1.5 max-w-2xl text-sm text-secondary md:text-md">
                {t('projects.privacy.title')}
              </p>
            </div>
            <Link href={PRIVACY_POLICY_HREF} className="btn btn-sm btn-secondary shrink-0">
              {t('projects.privacy.cta')}
              <ArrowRightIcon className="btn-arrow size-3.5" />
            </Link>
          </div>
        </FadeInView>
      </div>
    </section>
  );
};

/** Each layer stays transparent until its image has decoded, so art fades in rather than popping. */
function ScreenFrame({ project, entering }: { project: Project; entering: boolean }) {
  const [fillReady, setFillReady] = useState(false);
  const [artReady, setArtReady] = useState(false);

  return (
    <div className={`work-frame ${entering ? 'work-frame-in' : ''}`}>
      <Image
        src={project.image}
        alt=""
        fill
        sizes="96px"
        className="work-fill"
        data-ready={fillReady || undefined}
        onLoad={() => setFillReady(true)}
      />
      <Image
        src={project.image}
        alt={entering ? project.title : ''}
        fill
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="work-art"
        data-ready={artReady || undefined}
        onLoad={() => setArtReady(true)}
      />
    </div>
  );
}

function ProjectDetail({
  project,
  previous,
  position,
  lang,
  t,
}: {
  project: Project;
  previous: Project | null;
  position: number;
  lang: Language;
  t: (key: string) => string;
}) {
  return (
    <div className="work-detail">
      {project.image && (
        <div className="work-glow" aria-hidden="true">
          <Image
            key={project.id}
            src={project.image}
            alt=""
            fill
            sizes="96px"
            className="work-glow-image"
          />
        </div>
      )}

      <div className="work-screen">
        {previous?.image && <ScreenFrame key={previous.id} project={previous} entering={false} />}
        {project.image && <ScreenFrame key={project.id} project={project} entering />}
      </div>

      <div key={project.id} className="work-copy">
        {/* Stacked, the row above already shows the index, title and studio. */}
        <p className="eyebrow hidden items-baseline justify-between gap-4 lg:flex">
          <span className="truncate">{project.studio}</span>
          <span className="shrink-0 tabular-nums">
            {pad2(position + 1)} / {pad2(projects.length)}
          </span>
        </p>
        <h3 className="work-detail-title font-display mt-3 hidden text-2xl leading-tight font-semibold lg:block xl:text-3xl">
          {project.title}
        </h3>
        {project.description && (
          <div className="work-blurb">{renderSimpleMarkdown(project.description[lang])}</div>
        )}
        <ul className="mt-5 flex flex-wrap gap-2" aria-label={t('projects.platforms')}>
          {project.platforms.map((platform) => {
            // A playable demo is the one thing here a visitor can do right now, so
            // it leads the row as the primary button; store pages stay secondary.
            const isDemo = platform.name === 'Demo';
            return (
              <li key={platform.name}>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`work-platform ${isDemo ? 'work-platform-primary' : ''}`}
                  title={`${project.title} on ${platform.name}`}
                >
                  <PlatformIcon name={platform.name} />
                  {isDemo ? t('projects.playDemo') : platform.name}
                  <ExternalLinkIcon className="work-platform-arrow" />
                </a>
              </li>
            );
          })}
          {project.isInternal && project.platforms.length === 0 && (
            <li className="work-platform">{t('projects.tba')}</li>
          )}
        </ul>
      </div>
    </div>
  );
}
