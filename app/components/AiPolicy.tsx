'use client';

import type { CSSProperties } from 'react';
import { useRef, useState } from 'react';

import { useElementSize } from '../hooks/useElementSize';
import { useInView } from '../hooks/useInView';
import { useTranslation } from '../i18n';
import { PARTNER_URLS } from '../lib/site';
import { pad2 } from '../utils/pad2';
import { FadeInView } from './FadeInView';
import { ExternalLinkIcon } from './icons';
import { SectionHeader } from './SectionHeader';

const principles = ['creative', 'code', 'care', 'local'] as const;

const NETWORK_WIDTH = 1200;
const NETWORK_HEIGHT = 640;

/**
 * Opacity of the backdrop's fade at a point, 0..1. It mirrors the CSS mask on
 * `.ai-network-art` (an ellipse centred on the top-right corner), so anything
 * the mask hides can be left out of the drawing, and the animated nodes, which
 * sit outside the masked layer, can be given the same fade as plain opacity.
 * Keep the numbers in step with that rule in globals.css.
 */
function fadeAt(x: number, y: number): number {
  const distance = Math.hypot((x - NETWORK_WIDTH) / (NETWORK_WIDTH * 1.15), y / NETWORK_HEIGHT);
  return Math.min(1, Math.max(0, 1 - (distance - 0.08) / (0.72 - 0.08)));
}

function n(value: number): string {
  return value.toFixed(1);
}

/** Every ninth node is "live": accent-coloured, with a slow pulse. */
function isLive(index: number): boolean {
  return index % 9 === 4;
}

/** Seeded once (never Math.random) so the server and the browser draw the same picture. */
const network = (() => {
  let seed = 20261117;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nodes: { x: number; y: number; r: number }[] = [];
  for (let attempt = 0; attempt < 900 && nodes.length < 58; attempt++) {
    const x = 20 + random() * (NETWORK_WIDTH - 40);
    const y = 20 + random() * (NETWORK_HEIGHT - 40);
    if (nodes.every((node) => Math.hypot(node.x - x, node.y - y) > 78)) {
      nodes.push({ x, y, r: 2 + random() * 2 });
    }
  }

  const links = new Map<string, [number, number]>();
  for (const [index, node] of nodes.entries()) {
    const nearest = nodes
      .map((other, otherIndex) => ({
        otherIndex,
        distance: Math.hypot(node.x - other.x, node.y - other.y),
      }))
      .filter(({ otherIndex }) => otherIndex !== index)
      .toSorted((a, b) => a.distance - b.distance)
      .slice(0, 2);
    for (const { otherIndex } of nearest) {
      const pair: [number, number] = index < otherIndex ? [index, otherIndex] : [otherIndex, index];
      links.set(pair.join('-'), pair);
    }
  }

  const visible = (index: number) => fadeAt(nodes[index].x, nodes[index].y) > 0;

  const linkPath = [...links.values()]
    .filter(([from, to]) => visible(from) || visible(to))
    .map(
      ([from, to]) =>
        `M${n(nodes[from].x)} ${n(nodes[from].y)}L${n(nodes[to].x)} ${n(nodes[to].y)}`,
    )
    .join('');

  // Each static node is a full circle drawn as two arcs.
  const nodePath = nodes
    .filter((_, index) => visible(index) && !isLive(index))
    .map(
      ({ x, y, r }) =>
        `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0`,
    )
    .join('');

  const liveNodes = nodes
    .map((node, index) => ({ ...node, index, fade: fadeAt(node.x, node.y) }))
    .filter(({ index, fade }) => isLive(index) && fade > 0.02)
    .map(({ x, y, r, index, fade }) => ({
      key: index,
      left: `${n((x / NETWORK_WIDTH) * 100)}%`,
      top: `${n((y / NETWORK_HEIGHT) * 100)}%`,
      width: `${((r * 2 * 100) / NETWORK_WIDTH).toFixed(3)}%`,
      opacity: Number((fade * 0.85).toFixed(3)),
      delay: `${((index % 5) * -1.1).toFixed(1)}s`,
    }));

  return { linkPath, nodePath, liveNodes };
})();

/**
 * Two static paths behind one mask, rasterised once. Only the live nodes move,
 * and they animate opacity alone. Off-screen, the pulse is paused.
 */
function NetworkBackdrop({ dimmed }: { dimmed: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref);

  return (
    <div
      ref={ref}
      className="ai-network"
      data-live={inView}
      data-dimmed={dimmed}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${NETWORK_WIDTH} ${NETWORK_HEIGHT}`} className="ai-network-art">
        <path className="ai-network-links" d={network.linkPath} />
        <path className="ai-network-nodes" d={network.nodePath} />
      </svg>
      {network.liveNodes.map((node) => (
        <span
          key={node.key}
          className="ai-node-live"
          style={{ left: node.left, top: node.top, width: node.width, opacity: node.opacity }}
        >
          <span className="ai-node-pulse" style={{ animationDelay: node.delay }} />
        </span>
      ))}
    </div>
  );
}

function Flip({
  first,
  second,
  flipped,
  delay = 0,
  className = '',
}: {
  first: string;
  second: string;
  flipped: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <span
      className={`ai-flip ${className}`}
      data-flipped={flipped}
      style={{ '--flip-delay': `${delay}ms` } as CSSProperties}
    >
      <span aria-hidden={flipped}>{first}</span>
      <span aria-hidden={!flipped}>{second}</span>
    </span>
  );
}

/** [AI row, people row]. */
const SYNAPSES: [number, number][] = [
  [0, 0],
  [0, 5],
  [1, 1],
  [1, 3],
  [2, 4],
  [2, 3],
  [3, 2],
  [3, 4],
  [4, 5],
  [4, 1],
  [5, 2],
  [5, 3],
];

const SIGNALS = [
  { synapse: 0, delay: '0s' },
  { synapse: 4, delay: '-1.6s' },
  { synapse: 7, delay: '-3.1s' },
  { synapse: 10, delay: '-4.4s' },
];

function synapseCurve([from, to]: [number, number], width: number, rowHeight: number) {
  const y1 = (from + 0.5) * rowHeight;
  const y2 = (to + 0.5) * rowHeight;
  const points = [
    [0, y1],
    [width * 0.55, y1],
    [width * 0.45, y2],
    [width, y2],
  ];
  // Length by sampling: the signal's dash is sized and moved in real pixels.
  let length = 0;
  let [px, py] = points[0];
  for (let step = 1; step <= 24; step++) {
    const t = step / 24;
    const u = 1 - t;
    const weights = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const x = weights.reduce((sum, w, i) => sum + w * points[i][0], 0);
    const y = weights.reduce((sum, w, i) => sum + w * points[i][1], 0);
    length += Math.hypot(x - px, y - py);
    [px, py] = [x, y];
  }
  const d = `M0 ${n(y1)}C${n(width * 0.55)} ${n(y1)} ${n(width * 0.45)} ${n(y2)} ${n(width)} ${n(y2)}`;
  return { d, length: Math.ceil(length) };
}

/**
 * The layer between the two lists, drawn at its real pixel size rather than
 * stretched from a fixed viewBox: a stretched SVG measures dashes in its own
 * units, so a signal on a steep curve would stall and vanish halfway.
 */
function Synapses({ rows }: { rows: number }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const size = useElementSize(ref);
  const ready = size && size.width > 0 && size.height > 0;
  const rowHeight = ready ? size.height / rows : 0;

  return (
    <svg
      ref={ref}
      viewBox={ready ? `0 0 ${size.width} ${size.height}` : undefined}
      className="ai-synapses hidden size-full sm:col-start-2 sm:row-start-2 sm:row-end-[span_var(--rows)] sm:block"
      aria-hidden="true"
    >
      {ready &&
        SYNAPSES.map((synapse) => (
          <path
            key={synapse.join('-')}
            className="ai-synapse"
            d={synapseCurve(synapse, size.width, rowHeight).d}
          />
        ))}
      {ready &&
        SIGNALS.map(({ synapse, delay }) => {
          const { d, length } = synapseCurve(SYNAPSES[synapse], size.width, rowHeight);
          return (
            <path
              key={synapse}
              className="ai-signal"
              d={d}
              style={{ '--length': `${length}px`, animationDelay: delay } as CSSProperties}
            />
          );
        })}
    </svg>
  );
}

/** Equal rows (subgrid), so every synapse ends on its task's node. */
function Ledger({
  title,
  ai,
  people,
  off,
}: {
  title: string;
  ai: { label: string; offLabel: string; items: string[] };
  people: { label: string; items: string[] };
  off: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref);
  const rows = Math.max(ai.items.length, people.items.length);
  const span = { '--rows': rows } as CSSProperties;
  const listClass =
    'border-b border-line sm:row-start-2 sm:row-end-[span_var(--rows)] sm:grid sm:grid-rows-subgrid';

  return (
    <div
      ref={ref}
      className="ai-ledger grid content-start sm:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] sm:grid-rows-[auto_repeat(var(--rows),1fr)] xl:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)]"
      data-live={inView && !off}
      data-off={off}
      style={span}
    >
      <h3 className="sr-only">{title}</h3>

      <h4 className="eyebrow flex items-center gap-2.5 pb-4 sm:col-start-1 sm:row-start-1">
        <span
          className={`size-1.5 rounded-full transition-colors duration-300 ${off ? 'bg-ink' : 'bg-accent'}`}
        />
        <Flip first={ai.label} second={ai.offLabel} flipped={off} />
      </h4>
      <ul className={`mb-10 sm:col-start-1 sm:mb-0 ${listClass}`}>
        {ai.items.map((item, index) => (
          <li
            key={item}
            className="relative flex items-center border-t border-line py-2.5 text-md sm:pr-4"
          >
            <span
              style={{ transitionDelay: `${index * 45}ms` }}
              className={`transition-colors duration-300 ${off ? 'text-ink' : 'text-secondary'}`}
            >
              {item}
            </span>
            <span
              aria-hidden="true"
              style={{ transitionDelay: `${index * 45}ms` }}
              className={`absolute top-1/2 right-0 hidden size-1.5 translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 sm:block ${off ? 'bg-ink' : 'bg-accent'}`}
            />
          </li>
        ))}
      </ul>

      <Synapses rows={rows} />

      <h4 className="eyebrow flex items-center gap-2.5 pb-4 sm:col-start-3 sm:row-start-1 sm:pl-4">
        <span className="size-1.5 rounded-full bg-ink" />
        {people.label}
      </h4>
      <ul className={`sm:col-start-3 ${listClass}`}>
        {people.items.map((item) => (
          <li
            key={item}
            className="relative flex items-center border-t border-line py-2.5 text-md font-medium text-ink sm:pl-4"
          >
            {item}
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 hidden size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink sm:block"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AiPolicy() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);

  const states = [
    { active: enabled, title: t('aiPolicy.switch.onTitle'), body: t('aiPolicy.switch.onBody') },
    { active: !enabled, title: t('aiPolicy.switch.offTitle'), body: t('aiPolicy.switch.offBody') },
  ];
  const list = (key: string) => t(key, { returnObjects: true }) as string[];

  return (
    <section
      id="ai"
      className="section-pad relative overflow-hidden border-t border-line bg-surface"
    >
      <div className="ai-tint" data-dimmed={!enabled} aria-hidden="true" />
      <NetworkBackdrop dimmed={!enabled} />
      <div className="relative container">
        <SectionHeader title={t('aiPolicy.title')} subtitle={t('aiPolicy.subtitle')} />

        <FadeInView margin="-60px">
          <div className="ai-panel grid gap-x-16 gap-y-10 rounded-2xl p-6 md:p-10 lg:p-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-labelledby="ai-switch-label"
                  onClick={() => setEnabled((value) => !value)}
                  className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-smooth ${enabled ? 'bg-accent' : 'bg-surface-lighter'}`}
                >
                  <span
                    className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.35)] transition-transform duration-300 ease-smooth ${enabled ? 'translate-x-6' : ''}`}
                  />
                </button>
                <div className="min-w-0">
                  <p className="eyebrow flex items-baseline gap-2">
                    <span id="ai-switch-label" className="text-ink">
                      {t('aiPolicy.switch.label')}
                    </span>
                    <Flip
                      first={t('aiPolicy.switch.on')}
                      second={t('aiPolicy.switch.off')}
                      flipped={!enabled}
                      className={`transition-colors duration-300 ${enabled ? 'text-accent-ink' : 'text-muted'}`}
                    />
                  </p>
                  <p className="mt-1 text-sm text-muted">{t('aiPolicy.switch.note')}</p>
                </div>
              </div>

              {/* Both answers share one grid cell, so the panel never changes height.
                  The outgoing answer clears quickly and the incoming one waits for it:
                  cross-fading two different sentences in the same spot reads as a glitch. */}
              <div className="mt-10 grid md:mt-12" aria-live="polite">
                {states.map((state) => (
                  <div
                    key={state.title}
                    className={`transition-[opacity,transform] ease-smooth [grid-area:1/1] ${state.active ? 'delay-150 duration-300' : 'pointer-events-none translate-y-1.5 opacity-0 duration-150'}`}
                    aria-hidden={!state.active}
                  >
                    <h3 className="font-display text-3xl leading-tight font-semibold text-balance md:text-4xl">
                      {state.title}
                    </h3>
                    <p className="mt-4 max-w-xl leading-relaxed text-pretty text-secondary">
                      {state.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Ledger
              title={t('aiPolicy.ledger.title')}
              ai={{
                label: t('aiPolicy.ledger.ai.label'),
                offLabel: t('aiPolicy.ledger.ai.offLabel'),
                items: list('aiPolicy.ledger.ai.items'),
              }}
              people={{
                label: t('aiPolicy.ledger.people.label'),
                items: list('aiPolicy.ledger.people.items'),
              }}
              off={!enabled}
            />
          </div>
        </FadeInView>

        <FadeInView margin="-60px" className="mt-12 md:mt-16">
          <ol className="grid border-t border-line md:grid-cols-2">
            {principles.map((key, index) => (
              <li
                key={key}
                className="border-b border-line py-8 md:py-10 md:odd:border-r md:odd:pr-10 md:even:pl-10 lg:odd:pr-14 lg:even:pl-14"
              >
                <span className="font-mono text-xs text-accent-ink">{pad2(index + 1)}</span>
                <h3 className="font-display mt-3 text-2xl font-semibold text-balance md:text-3xl">
                  {t(`aiPolicy.principles.${key}.title`)}
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-pretty text-muted">
                  {t(`aiPolicy.principles.${key}.body`)}
                </p>
                {key === 'care' && (
                  <p className="mt-4 flex max-w-md items-baseline gap-2.5 text-sm text-subtle">
                    <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-online" />
                    <span>{t('aiPolicy.principles.care.note')}</span>
                  </p>
                )}
                {key === 'local' && (
                  <p className="mt-4 flex max-w-md items-baseline gap-2.5 text-sm text-subtle">
                    <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-zet" />
                    <span>
                      {t('aiPolicy.principles.local.partner.before')}{' '}
                      <a
                        href={PARTNER_URLS.zetLabs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline inline-flex items-baseline gap-1 font-medium text-ink hover:text-zet-ink"
                      >
                        {t('aiPolicy.principles.local.partner.name')}
                        <ExternalLinkIcon className="size-2.5 self-center opacity-60" />
                      </a>
                      {t('aiPolicy.principles.local.partner.after')}
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </FadeInView>
      </div>
    </section>
  );
}
