'use client';

import { type CSSProperties, useRef } from 'react';

import { useInView } from '../hooks/useInView';
import { useTranslation } from '../i18n';
import { FadeInView } from './FadeInView';
import { SectionHeader } from './SectionHeader';

type Member = 'you' | 'us';

/**
 * Each engagement model as a seating plan: `team` is who sits inside the
 * client's team, `crew` is a separate Flying Rat group working alongside it.
 */
const models: { key: string; team: Member[]; crew: number }[] = [
  { key: 'embedded', team: ['you', 'you', 'us', 'you', 'us', 'you', 'you', 'us'], crew: 0 },
  { key: 'scoped', team: ['you', 'you', 'you', 'you'], crew: 3 },
  { key: 'mixed', team: ['you', 'you', 'us', 'you', 'us'], crew: 2 },
  { key: 'full', team: ['you'], crew: 6 },
];

const DOT = 6;
const STEP = 22;
const PAD = 18;
const LINK = 18;
const HEIGHT = 44;

function capsuleWidth(count: number): number {
  return PAD * 2 + DOT * 2 + (count - 1) * STEP;
}

function dotX(index: number, offset = 0): number {
  return offset + PAD + DOT + index * STEP;
}

/** Custom properties the stylesheet turns into animation delays. */
function timing(vars: Record<`--${string}`, number>) {
  return vars as CSSProperties;
}

function ModelDiagram({ team, crew, order }: { team: Member[]; crew: number; order: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const teamWidth = capsuleWidth(team.length);
  const crewStart = teamWidth + LINK;
  const width = crew > 0 ? crewStart + capsuleWidth(crew) : teamWidth;

  // Our people take their seats in reading order: first those inside the team,
  // then the separate crew, then the link between the two.
  const isUs = (member: Member) => member === 'us';
  const joiners = team.filter(isUs).length;

  // The stylesheet does the animating; it only needs to know when to run.
  const live = useInView(ref, { rootMargin: '0px 0px -10% 0px' });

  return (
    <svg
      ref={ref}
      viewBox={`-1 -1 ${width + 2} ${HEIGHT + 2}`}
      width={width + 2}
      height={HEIGHT + 2}
      className="seat-plan max-w-full overflow-visible"
      data-live={live}
      style={timing({ '--plan': order })}
      aria-hidden="true"
    >
      <rect
        width={teamWidth}
        height={HEIGHT}
        rx={HEIGHT / 2}
        className="fill-none stroke-line-strong"
      />
      {team.map((member, index) => {
        const dot = (
          <circle
            cx={dotX(index)}
            cy={HEIGHT / 2}
            r={DOT}
            className={`seat-dot ${isUs(member) ? 'fill-accent' : 'fill-ink'}`}
            style={timing({ '--pos': index })}
          />
        );
        return isUs(member) ? (
          <g
            // oxlint-disable-next-line react/no-array-index-key -- fixed seats, never reordered
            key={index}
            className="seat-join"
            style={timing({ '--seat': team.slice(0, index).filter(isUs).length })}
          >
            {dot}
          </g>
        ) : (
          // oxlint-disable-next-line react/no-array-index-key -- fixed seats, never reordered
          <g key={index}>{dot}</g>
        );
      })}

      {crew > 0 && (
        <>
          <line
            x1={teamWidth}
            x2={crewStart}
            y1={HEIGHT / 2}
            y2={HEIGHT / 2}
            className="seat-link stroke-accent"
            strokeDasharray="3 3"
            style={timing({ '--seat': joiners + crew + 1 })}
          />
          <g className="seat-crew" style={timing({ '--seat': joiners })}>
            <rect
              x={crewStart}
              width={capsuleWidth(crew)}
              height={HEIGHT}
              rx={HEIGHT / 2}
              className="seat-outline fill-none stroke-accent"
              strokeDasharray="4 4"
            />
          </g>
          {Array.from({ length: crew }, (_, index) => (
            <g key={index} className="seat-join" style={timing({ '--seat': joiners + 1 + index })}>
              <circle
                cx={dotX(index, crewStart)}
                cy={HEIGHT / 2}
                r={DOT}
                className="seat-dot fill-accent"
                style={timing({ '--pos': team.length + 1 + index })}
              />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

/** Systems we built (AI with Zet Labs) get their own brand colour; names are the same in every language. */
const BRAND_DOTS: Record<string, string> = {
  Scribe: 'bg-scribe',
  Hikari: 'bg-hikari',
  AI: 'bg-zet',
};

export function HowWeWork() {
  const { t } = useTranslation();
  const specs = t('howWeWork.tools.specs', { returnObjects: true }) as {
    name: string;
    label: string;
  }[];

  return (
    <section id="how-we-work" className="section-pad relative">
      <div className="container">
        <SectionHeader title={t('howWeWork.title')} subtitle={t('howWeWork.subtitle')} />

        <FadeInView margin="-60px">
          <div className="eyebrow mb-5 flex flex-wrap gap-x-6 gap-y-2">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-ink" />
              {t('howWeWork.legend.you')}
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-accent" />
              {t('howWeWork.legend.us')}
            </span>
          </div>

          {/* Every plan carries a left and a bottom rule; the list is pulled one
              gutter wider than this frame, which clips the outer ones away. That
              holds for one, two or four columns without per-column rules. */}
          <div className="overflow-hidden border-t border-line">
            <ol className="grid md:-mr-8 md:-ml-[calc(2rem+1px)] md:grid-cols-2 xl:grid-cols-4">
              {models.map(({ key, team, crew }, index) => (
                // Between phone and tablet width (a foldable's inner screen) there is room
                // for the plan and its text side by side, but not for three columns.
                <li
                  key={key}
                  className="plan group relative border-b border-line py-8 sm:max-md:grid sm:max-md:grid-cols-[17rem_1fr] sm:max-md:items-center sm:max-md:gap-x-8 md:border-l md:px-8 md:py-10"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-smooth group-hover:scale-x-100"
                  />
                  <div>
                    <p className="eyebrow mb-6 flex gap-3">
                      <span className="text-accent-ink">{String.fromCodePoint(65 + index)}</span>
                      {t(`howWeWork.models.${key}.label`)}
                    </p>
                    <ModelDiagram team={team} crew={crew} order={index} />
                  </div>
                  <div>
                    <h3 className="font-display mt-7 text-2xl font-semibold sm:max-md:mt-0 md:text-3xl xl:text-2xl 2xl:text-3xl">
                      {t(`howWeWork.models.${key}.title`)}
                    </h3>
                    <p className="mt-3 max-w-sm text-md leading-relaxed text-pretty text-muted">
                      {t(`howWeWork.models.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid border-line md:grid-cols-3 md:border-b">
            <div className="flex items-center border-b border-line py-10 md:col-span-2 md:border-b-0 md:py-14 md:pr-12">
              <p className="font-display max-w-[52rem] text-[1.75rem] leading-[1.14] font-semibold text-pretty text-subtle sm:text-4xl lg:text-[2.75rem]">
                <strong className="font-semibold text-ink">{t('howWeWork.team.title')}</strong>{' '}
                {t('howWeWork.team.body')}
              </p>
            </div>

            <div className="border-line py-10 md:border-l md:py-14 md:pl-8">
              <h3 className="eyebrow text-ink">{t('howWeWork.tools.title')}</h3>
              <p className="mt-4 text-md leading-relaxed text-pretty text-muted">
                {t('howWeWork.tools.body')}
              </p>

              <dl className="mt-6 border-t border-line">
                {specs.map((spec) => (
                  <div
                    key={spec.name}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                  >
                    <dt className="flex items-center gap-2 font-mono text-meta text-ink">
                      <span
                        className={`size-1.5 rounded-full ${BRAND_DOTS[spec.name] ?? 'bg-line-strong'}`}
                      />
                      {spec.name}
                    </dt>
                    <dd className="text-right text-sm text-muted">{spec.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
