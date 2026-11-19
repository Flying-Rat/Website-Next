'use client';

import { useEffect, useRef, useState } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useInView } from '../../../hooks/useInView';
import { useThemeChange } from '../../../hooks/useThemeChange';
import { useTranslation } from '../../../i18n';
import type { AboutDemoProps } from '../types';
import { RockfallGame, type RockfallState } from './RockfallGame';

const PLATE =
  'glass eyebrow flex h-9 items-center rounded-full border border-line px-4 text-secondary';

export function RockfallDemo({ animate }: AboutDemoProps) {
  const { t } = useTranslation();
  const scene = useRef<HTMLDivElement>(null);
  const game = useRef<RockfallGame | null>(null);
  const visible = useInView(scene);
  const size = useElementSize(scene);
  const [state, setState] = useState<RockfallState | null>(null);

  // The scene only exists while the section is on screen, so its GL context is
  // handed back whenever the visitor scrolls away.
  useEffect(() => {
    if (!visible || !scene.current) {
      return;
    }
    const round = new RockfallGame(scene.current, animate, setState);
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

  const over = state && state.phase !== 'play';

  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[22rem] md:inset-y-0 md:left-[38%] md:h-auto">
        <div ref={scene} className="absolute inset-0" />
        <button
          type="button"
          aria-label={t('about.demos.rockfall.name')}
          aria-describedby="rockfall-hint"
          className="absolute inset-0 h-full w-full cursor-crosshair touch-manipulation focus-visible:-outline-offset-4"
          onPointerMove={(e) => game.current?.aimAt(e.clientX, e.clientY)}
          onPointerLeave={() => game.current?.clearAim()}
          onClick={(e) =>
            // From the keyboard there is no pointer to aim with, so the game picks a rat.
            game.current?.fire(e.detail === 0 ? null : { x: e.clientX, y: e.clientY })
          }
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="relative container h-full">
          <div className="absolute top-[19rem] right-6 left-6 flex flex-wrap items-center gap-2 md:top-auto md:bottom-12 md:left-auto md:justify-end">
            <p id="rockfall-hint" className={`${PLATE} ${over ? 'text-ink' : ''}`}>
              {state?.phase === 'won'
                ? t('about.demos.rockfall.won')
                : state?.phase === 'lost'
                  ? t('about.demos.rockfall.lost')
                  : t('about.demos.rockfall.hint')}
            </p>
            <p className={PLATE}>
              {t('about.demos.rockfall.rats')}
              <b className="ml-2 font-semibold text-ink tabular-nums">
                {state ? `${state.rats}/${state.total}` : ''}
              </b>
            </p>
            <p className={PLATE}>
              {t('about.demos.rockfall.shots')}
              <b className="ml-2 font-semibold text-ink tabular-nums">{state?.shots ?? ''}</b>
            </p>
            <button
              type="button"
              className={`${PLATE} pointer-events-auto cursor-pointer transition-colors hover:text-ink`}
              onClick={() => game.current?.restart()}
            >
              {t('about.demos.rockfall.again')}
            </button>
          </div>
          <span role="status" className="sr-only">
            {state && t('about.demos.rockfall.status', { rats: state.rats, shots: state.shots })}
          </span>
        </div>
      </div>
    </>
  );
}
