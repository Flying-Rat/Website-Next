'use client';

import { useEffect, useRef, useState } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useInView } from '../../../hooks/useInView';
import { useThemeChange } from '../../../hooks/useThemeChange';
import { useTranslation } from '../../../i18n';
import { DEMO_SCENE, DemoHud, DemoNote, DemoStat } from '../DemoHud';
import type { AboutDemoProps } from '../types';
import { Cannon3dRound } from './Cannon3dRound';

export function Cannon3dDemo({ frame, copy, animate }: AboutDemoProps) {
  const { t } = useTranslation();
  // Read by the round when a shot misses, so a change of language does not
  // rebuild the whole scene.
  const missLabel = t('about.demos.cannon3d.miss');
  const miss = useRef(missLabel);
  const field = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLButtonElement>(null);
  const note = useRef<HTMLSpanElement>(null);
  const round = useRef<Cannon3dRound | null>(null);
  const visible = useInView(field);
  const size = useElementSize(field);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState<number | null>(null);

  // The scene only exists while the section is on screen, so its GL context is
  // handed back whenever the visitor scrolls away.
  useEffect(() => {
    const section = frame.current;
    if (
      !visible ||
      !section ||
      !field.current ||
      !stage.current ||
      !copy.current ||
      !note.current
    ) {
      return;
    }
    const cannon = stage.current;
    const game = new Cannon3dRound(
      field.current,
      cannon,
      copy.current,
      note.current,
      animate,
      () => miss.current,
      (points) => {
        setLast(points);
        setScore((value) => value + points);
      },
    );
    round.current = game;

    const visibility = () => game.setActive(!document.hidden);
    // Over the cannon itself the barrel would turn to point at its own body, so
    // it stays on what it last aimed at; a click there fires at that.
    const aim = (event: PointerEvent) => {
      if (!cannon.contains(event.target as Node)) {
        game.aimAt(event.clientX, event.clientY);
      }
    };
    const rest = () => game.clearAim();
    const fire = (event: MouseEvent) => {
      // From the keyboard there is no pointer to aim with, so the cannon picks a letter.
      if (event.detail === 0) {
        game.fire(null);
      } else if (cannon.contains(event.target as Node)) {
        game.fireAhead();
      } else if (document.getSelection()?.isCollapsed !== false) {
        game.fire({ x: event.clientX, y: event.clientY });
      }
    };

    visibility();
    document.addEventListener('visibilitychange', visibility);
    section.addEventListener('pointermove', aim);
    section.addEventListener('pointerleave', rest);
    section.addEventListener('click', fire);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      section.removeEventListener('pointermove', aim);
      section.removeEventListener('pointerleave', rest);
      section.removeEventListener('click', fire);
      game.dispose();
      round.current = null;
    };
  }, [visible, frame, copy, animate]);

  useEffect(() => {
    miss.current = missLabel;
  }, [missLabel]);

  useEffect(() => {
    if (size) {
      round.current?.resize();
    }
  }, [size]);

  useThemeChange(() => round.current?.restyle());

  return (
    <div ref={field} className="pointer-events-none absolute inset-0 z-20">
      {/* Above the canvas, which is added after it: the plates' glass has to blur
          the floor behind them, not sit under it. */}
      <div className={`${DEMO_SCENE} z-10`}>
        <div className="absolute inset-x-6 top-20 md:top-1/2 md:-translate-y-2/3">
          <button
            type="button"
            ref={stage}
            aria-label={t('about.demos.cannon3d.name')}
            aria-describedby="cannon3d-hint"
            className="pointer-events-auto mx-auto block h-36 w-full max-w-sm cursor-pointer rounded-sm select-none md:h-44"
          />
        </div>
      </div>
      {/* Glass plates rather than bare text: the floor's grid runs behind them. */}
      <DemoHud>
        <DemoNote id="cannon3d-hint">{t('about.demos.cannon3d.hint')}</DemoNote>
        <DemoStat label={t('about.demos.cannon3d.score')} value={score} />
      </DemoHud>
      <span role="status" className="sr-only">
        {last === null
          ? ''
          : `${last ? t('about.demos.cannon3d.hit', { points: last }) : t('about.demos.cannon3d.miss')}. ${t('about.demos.cannon3d.score')} ${score}`}
      </span>
      <span
        ref={note}
        aria-hidden="true"
        className="absolute top-0 left-0 font-mono text-meta font-semibold text-muted opacity-0 data-[hit=true]:text-accent-ink"
      />
    </div>
  );
}
