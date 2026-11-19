'use client';

import { useEffect, useRef, useState } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useInView } from '../../../hooks/useInView';
import { useThemeChange } from '../../../hooks/useThemeChange';
import { useTranslation } from '../../../i18n';
import { DEMO_SCENE, DemoHud, DemoNote, DemoStat } from '../DemoHud';
import type { AboutDemoProps } from '../types';
import { RockfallGame, type RockfallState } from './RockfallGame';

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

  const over = state !== null && state.phase !== 'play';

  return (
    <>
      <div className={DEMO_SCENE}>
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
      <DemoHud>
        <DemoNote id="rockfall-hint" strong={over}>
          {state?.phase === 'won'
            ? t('about.demos.rockfall.won')
            : state?.phase === 'lost'
              ? t('about.demos.rockfall.lost')
              : t('about.demos.rockfall.hint')}
        </DemoNote>
        <DemoStat
          label={t('about.demos.rockfall.rats')}
          value={state ? `${state.rats}/${state.total}` : ''}
        />
        <DemoStat label={t('about.demos.rockfall.shots')} value={state?.shots ?? ''} />
      </DemoHud>
      <span role="status" className="sr-only">
        {state && t('about.demos.rockfall.status', { rats: state.rats, shots: state.shots })}
      </span>
    </>
  );
}
