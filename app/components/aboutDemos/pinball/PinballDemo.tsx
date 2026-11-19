'use client';

import { useEffect, useRef, useState } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useInView } from '../../../hooks/useInView';
import { useThemeChange } from '../../../hooks/useThemeChange';
import { useTranslation } from '../../../i18n';
import type { AboutDemoProps } from '../types';
import { PinballGame, type PinballState } from './PinballGame';

const PLATE =
  'glass eyebrow flex h-9 items-center rounded-full border border-line px-4 text-secondary';
const FLIP_KEYS = new Set([' ', 'Enter']);

export function PinballDemo({ animate }: AboutDemoProps) {
  const { t } = useTranslation();
  const scene = useRef<HTMLDivElement>(null);
  const game = useRef<PinballGame | null>(null);
  const visible = useInView(scene);
  const size = useElementSize(scene);
  const [state, setState] = useState<PinballState | null>(null);

  // The scene only exists while the section is on screen, so its GL context is
  // handed back whenever the visitor scrolls away.
  useEffect(() => {
    if (!visible || !scene.current) {
      return;
    }
    const round = new PinballGame(scene.current, animate, setState);
    game.current = round;
    const visibility = () => round.setActive(!document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      round.dispose();
      game.current = null;
    };
  }, [visible, animate]);

  useEffect(() => {
    if (size) {
      game.current?.resize();
    }
  }, [size]);

  useThemeChange(() => game.current?.restyle());

  const flip = (raised: boolean) => game.current?.setRaised(raised);
  const over = state && state.phase !== 'play';

  return (
    <>
      <div className="absolute top-0 right-0 left-0 h-[21rem] md:bottom-24 md:left-1/2 md:h-auto">
        <div ref={scene} className="absolute inset-0" />
        <button
          type="button"
          aria-label={t('about.demos.pinball.name')}
          aria-describedby="pinball-hint"
          className="absolute inset-0 h-full w-full cursor-pointer touch-manipulation select-none focus-visible:-outline-offset-4"
          onPointerDown={(e) => {
            if (e.button === 0) {
              // Held, so letting go anywhere on the page still drops the flippers.
              e.currentTarget.setPointerCapture(e.pointerId);
              flip(true);
            }
          }}
          onPointerUp={() => flip(false)}
          onPointerCancel={() => flip(false)}
          onLostPointerCapture={() => flip(false)}
          onKeyDown={(e) => {
            if (FLIP_KEYS.has(e.key) && !e.repeat) {
              flip(true);
            }
          }}
          onKeyUp={(e) => {
            if (FLIP_KEYS.has(e.key)) {
              flip(false);
            }
          }}
          onBlur={() => flip(false)}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <div className="pointer-events-none absolute top-[21.5rem] right-6 left-6 z-10 flex flex-wrap items-center justify-center gap-2 md:top-auto md:right-0 md:bottom-10 md:left-1/2">
        <p id="pinball-hint" className={`${PLATE} ${over ? 'text-ink' : ''}`}>
          {animate
            ? state?.phase === 'won'
              ? t('about.demos.pinball.won')
              : state?.phase === 'lost'
                ? t('about.demos.pinball.lost')
                : state?.ready
                  ? t('about.demos.pinball.ready')
                  : t('about.demos.pinball.hint')
            : t('about.demos.pinball.still')}
        </p>
        <p className={PLATE}>
          {t('about.demos.pinball.balls')}
          <b className="ml-2 font-semibold text-ink tabular-nums">{state?.balls ?? ''}</b>
        </p>
        <button
          type="button"
          className={`${PLATE} pointer-events-auto cursor-pointer transition-colors hover:text-ink`}
          onClick={() => game.current?.restart()}
        >
          {t('about.demos.pinball.again')}
        </button>
        <span role="status" className="sr-only">
          {state && t('about.demos.pinball.status', { balls: state.balls })}
        </span>
      </div>
    </>
  );
}
