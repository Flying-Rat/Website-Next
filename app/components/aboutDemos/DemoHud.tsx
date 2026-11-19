'use client';

import type { ReactNode } from 'react';

import { useTranslation } from '../../i18n';
import { DEMO_NAMES, type DemoName, chooseDemo, useDemoName } from './choice';

/**
 * The plates every demo shows under its play area: what to do and its numbers,
 * and under them the switch to the other demos. What they say is the demo's;
 * how they look is shared, so switching demos never changes the furniture.
 */

const PLATE = 'demo-plate hud-plate';

/**
 * Where a demo's scene goes: the same box for every demo, so switching swaps
 * what is in it and nothing around it moves. Over the copy on small screens,
 * beside it from `md` up.
 */
export const DEMO_SCENE = 'absolute inset-x-0 top-0 h-[22rem] md:inset-y-0 md:left-[38%] md:h-auto';

/**
 * The demo a visitor just picked from the keyboard. Its own switcher, drawn by
 * the next demo, takes the focus back, since the one they pressed is gone.
 */
let refocus: DemoName | null = null;

/**
 * The rows themselves, centred under the scene box. Render it as a child of the
 * section, or of a box that covers the section exactly. It grows upward from a
 * fixed bottom edge, so the switcher stays put whatever a demo shows above it.
 */
export function DemoHud({ children }: { children?: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-6 top-0 z-10 flex h-[25rem] flex-col items-center justify-end gap-3 md:inset-x-auto md:top-auto md:right-0 md:bottom-10 md:left-[38%] md:h-auto">
      {children && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">{children}</div>
      )}
      <DemoSwitcher />
    </div>
  );
}

function DemoSwitcher() {
  const { t } = useTranslation();
  const current = useDemoName();
  const names: Record<DemoName, string> = {
    island: t('about.demos.island.name'),
    cannon3d: t('about.demos.cannon3d.name'),
    rockfall: t('about.demos.rockfall.name'),
  };

  return (
    <div
      role="group"
      aria-label={t('about.demos.switch')}
      className="demo-switcher pointer-events-auto"
    >
      {DEMO_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          className="demo-switch"
          aria-pressed={name === current}
          ref={(button) => {
            if (button && refocus === name) {
              refocus = null;
              button.focus({ preventScroll: true });
            }
          }}
          onClick={(event) => {
            if (name !== current) {
              // A click leaves the focus to the pointer; only the keyboard needs it back.
              refocus = event.detail === 0 ? name : null;
              chooseDemo(name);
            }
          }}
        >
          {names[name]}
        </button>
      ))}
    </div>
  );
}

/** `strong` while it reports how a round ended. */
export function DemoNote({
  id,
  strong = false,
  children,
}: {
  id?: string;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <p id={id} className={`${PLATE} ${strong ? 'text-ink' : ''}`}>
      {children}
    </p>
  );
}

export function DemoStat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <p className={PLATE}>
      {label}
      <b className="ml-2 font-semibold text-ink tabular-nums">{value}</b>
    </p>
  );
}

/** A plate on its own, for anything else a demo shows in the same style. */
export function DemoPlate({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${PLATE} ${className}`}>{children}</div>;
}
