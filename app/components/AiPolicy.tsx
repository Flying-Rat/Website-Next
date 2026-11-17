'use client';

import { useRef, useState } from 'react';

import { useInView } from '../hooks/useInView';
import { useTranslation } from '../i18n';
import { pad2 } from '../utils/pad2';
import { FadeInView } from './FadeInView';
import { ExternalLinkIcon } from './icons';
import { SectionHeader } from './SectionHeader';

const principles = ['creative', 'code', 'care', 'local'] as const;

const ZET_LABS_URL = 'https://www.zetlabs.ai/';

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

/** A coordinate as it is written into a path: one decimal is plenty. */
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

function LedgerColumn({
  label,
  items,
  human = false,
  off = false,
}: {
  label: string;
  items: string[];
  human?: boolean;
  /** Struck out rather than hidden. */
  off?: boolean;
}) {
  return (
    <div className={`p-6 md:p-8 ${human ? 'border-t border-line sm:border-t-0 sm:border-l' : ''}`}>
      <p
        className={`font-display flex items-center gap-2.5 text-xl font-semibold transition-colors duration-300 md:text-2xl ${off ? 'text-subtle' : ''}`}
      >
        <span
          className={`size-2.5 shrink-0 rounded-full border transition-colors duration-300 ${
            human
              ? 'border-ink bg-ink'
              : off
                ? 'border-subtle bg-transparent'
                : 'border-accent bg-accent'
          }`}
        />
        {label}
      </p>
      <ul className="mt-5">
        {items.map((item) => (
          <li
            key={item}
            // The strike-through is always there and only its colour changes, so
            // turning the switch off draws it in instead of snapping.
            className={`border-t border-line py-2.5 text-md line-through transition-colors duration-300 ${
              human
                ? 'font-medium text-ink decoration-transparent'
                : off
                  ? 'text-subtle decoration-subtle'
                  : 'text-muted decoration-transparent'
            }`}
          >
            {item}
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

        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          <FadeInView margin="-60px" className="lg:col-span-5">
            <div className="surface-card flex h-full flex-col bg-page p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <span id="ai-switch-label" className="eyebrow">
                  {t('aiPolicy.switch.label')}
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs tracking-wide uppercase transition-colors duration-300 ${enabled ? 'text-accent-ink' : 'text-muted'}`}
                    aria-hidden="true"
                  >
                    {enabled ? t('aiPolicy.switch.on') : t('aiPolicy.switch.off')}
                  </span>
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
                </span>
              </div>

              {/* Both answers share one grid cell, so the card never changes height.
                  The outgoing answer clears quickly and the incoming one waits for it:
                  cross-fading two different sentences in the same spot reads as a glitch. */}
              <div className="mt-10 grid md:mt-12" aria-live="polite">
                {states.map((state) => (
                  <div
                    key={state.title}
                    className={`transition-[opacity,transform] ease-smooth [grid-area:1/1] ${state.active ? 'delay-150 duration-300' : 'pointer-events-none translate-y-1.5 opacity-0 duration-150'}`}
                    aria-hidden={!state.active}
                  >
                    <h3 className="font-display text-3xl font-semibold text-balance md:text-4xl">
                      {state.title}
                    </h3>
                    <p className="mt-4 max-w-sm leading-relaxed text-pretty text-secondary">
                      {state.body}
                    </p>
                  </div>
                ))}
              </div>

              <p className="eyebrow mt-auto pt-8">{t('aiPolicy.switch.note')}</p>
            </div>
          </FadeInView>

          <FadeInView delay={0.1} margin="-60px" className="lg:col-span-7">
            <div className="surface-card flex h-full flex-col overflow-hidden bg-page">
              <p className="eyebrow border-b border-line px-6 py-4 md:px-8">
                {t('aiPolicy.ledger.title')}
              </p>
              <div className="grid flex-1 sm:grid-cols-2">
                <LedgerColumn
                  label={t('aiPolicy.ledger.ai.label')}
                  items={list('aiPolicy.ledger.ai.items')}
                  off={!enabled}
                />
                <LedgerColumn
                  label={t('aiPolicy.ledger.people.label')}
                  items={list('aiPolicy.ledger.people.items')}
                  human
                />
              </div>
            </div>
          </FadeInView>
        </div>

        <FadeInView margin="-60px" className="mt-12 md:mt-16">
          <ol className="border-t border-line">
            {principles.map((key, index) => (
              <li
                key={key}
                className="grid gap-x-8 gap-y-3 border-b border-line py-7 md:grid-cols-12 md:items-baseline md:py-9"
              >
                <span className="font-mono text-xs text-accent-ink md:col-span-1">
                  {pad2(index + 1)}
                </span>
                <h3 className="font-display text-2xl font-semibold text-balance md:col-span-5 md:text-3xl lg:text-4xl">
                  {t(`aiPolicy.principles.${key}.title`)}
                </h3>
                <div className="max-w-xl md:col-span-6">
                  <p className="leading-relaxed text-pretty text-muted">
                    {t(`aiPolicy.principles.${key}.body`)}
                  </p>
                  {key === 'care' && (
                    <p className="mt-4 flex items-baseline gap-2.5 text-sm text-subtle">
                      <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-online" />
                      <span>{t('aiPolicy.principles.care.note')}</span>
                    </p>
                  )}
                  {key === 'local' && (
                    <p className="mt-4 flex items-baseline gap-2.5 text-sm text-subtle">
                      <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-accent" />
                      <span>
                        {t('aiPolicy.principles.local.partner.before')}{' '}
                        <a
                          href={ZET_LABS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-underline inline-flex items-baseline gap-1 font-medium text-ink hover:text-accent-ink"
                        >
                          {t('aiPolicy.principles.local.partner.name')}
                          <ExternalLinkIcon className="size-2.5 self-center opacity-60" />
                        </a>
                        {t('aiPolicy.principles.local.partner.after')}
                      </span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </FadeInView>
      </div>
    </section>
  );
}
