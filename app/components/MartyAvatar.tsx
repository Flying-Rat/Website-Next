'use client';

import { type CSSProperties, useId, useRef } from 'react';

import { useInView } from '../hooks/useInView';

/** Vertical distance between bands, in viewBox units (100 = the avatar's width). */
const GAP = 8.5;
/** Where the crest of the coral wave sits. */
const CREST = 52;

/**
 * The silk's edge: two sine waves, scaled per band so the folds swell towards the
 * crest and flatten away from it. `k` is the band's distance from the crest.
 */
function waveY(x: number, k: number) {
  const swell = 1 - Math.min(Math.abs(k), 5) * 0.12;
  return (
    CREST +
    k * GAP +
    swell *
      (11 * Math.sin((x / 100) * Math.PI * 1.7 + 0.4) +
        1.8 * Math.sin((x / 100) * Math.PI * 3.4 - k * 0.5))
  );
}

function wavePath(k: number) {
  let d = '';
  for (let x = -6; x <= 106; x += 4) {
    d += `${x === -6 ? 'M' : 'L'}${x} ${waveY(x, k).toFixed(2)}`;
  }
  return d;
}

const CREST_PATH = wavePath(0);
/** The coral body: everything below the crest. */
const BODY = `${CREST_PATH}L106 110L-6 110Z`;
/** Ink echoes above the crest, fading as they rise. */
const ECHOES = [1, 2, 3, 4].map((step) => ({
  d: wavePath(-step),
  opacity: [0.85, 0.55, 0.34, 0.2][step - 1],
}));
/** Folds cut into the coral below the crest. */
const FOLDS = [1, 2, 3, 4].map((step) => wavePath(step));

type MartyAvatarProps = {
  className?: string;
  /** Accessible name; without one the avatar is decorative. */
  label?: string;
};

/** Staggers a band's ripple by its distance from the crest, so the motion travels outwards. */
const band = (distance: number) => ({ '--band': distance }) as CSSProperties;

/**
 * Marty's avatar: a coral wave of silk with ink echoes rising above it. Drawn for
 * 40-56px, so every line is at least a pixel wide at that size.
 */
export function MartyAvatar({ className = '', label }: MartyAvatarProps) {
  const clipId = useId();
  const ref = useRef<SVGSVGElement | null>(null);
  const inView = useInView(ref);

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      data-live={inView}
      className={`silk shrink-0 ${className}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <clipPath id={clipId}>
        <circle cx="50" cy="50" r="50" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" className="fill-surface-light" />
        <g fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-ink">
          {ECHOES.map(({ d, opacity }, index) => (
            <path
              key={d}
              d={d}
              strokeOpacity={opacity}
              className="silk-band"
              style={band(index + 1)}
            />
          ))}
        </g>
        <path d={BODY} className="silk-band fill-accent" style={band(0)} />
        <g fill="none" strokeWidth="2.4" className="stroke-page" strokeOpacity="0.45">
          {FOLDS.map((d, index) => (
            <path key={d} d={d} className="silk-band" style={band(index + 1)} />
          ))}
        </g>
      </g>
    </svg>
  );
}
