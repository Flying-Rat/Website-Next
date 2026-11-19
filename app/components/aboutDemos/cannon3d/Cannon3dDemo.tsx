'use client';

import { useEffect, useRef, useState } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useInView } from '../../../hooks/useInView';
import { useThemeChange } from '../../../hooks/useThemeChange';
import { useTranslation } from '../../../i18n';
import { DemoHud, DemoNote, DemoStat } from '../DemoHud';
import type { AboutDemoProps } from '../types';
import { Cannon3dRound } from './Cannon3dRound';

export function Cannon3dDemo({ frame, copy, animate }: AboutDemoProps) {
  const { t } = useTranslation();
  const miss = t('about.demos.cannon3d.miss');
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
      miss,
      (points) => {
        setLast(points);
        setScore((value) => value + points);
      },
    );
    round.current = game;

    const visibility = () => game.setActive(!document.hidden);
    const aim = (event: PointerEvent) => game.aimAt(event.clientX, event.clientY);
    const rest = () => game.clearAim();
    const fire = (event: MouseEvent) => {
      // From the keyboard, or on the cannon itself, there is no letter under the
      // pointer to aim at, so the cannon picks one.
      if (event.detail === 0 || cannon.contains(event.target as Node)) {
        game.fire(null);
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
  }, [visible, frame, copy, animate, miss]);

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
      <div className="absolute inset-0 z-10 container">
        <div className="absolute inset-x-6 top-14 md:top-1/2 md:left-2/3 md:-translate-y-1/2">
          <button
            type="button"
            ref={stage}
            aria-label={t('about.demos.cannon3d.name')}
            aria-describedby="cannon3d-hint"
            className="pointer-events-auto block h-36 w-full cursor-pointer rounded-sm select-none md:h-44"
          />
          {/* Glass plates rather than bare text: the floor's grid runs behind them. */}
          <DemoHud className="mt-10">
            <DemoNote id="cannon3d-hint">{t('about.demos.cannon3d.hint')}</DemoNote>
            <DemoStat label={t('about.demos.cannon3d.score')} value={score} />
          </DemoHud>
          <span role="status" className="sr-only">
            {last === null
              ? ''
              : `${last ? t('about.demos.cannon3d.hit', { points: last }) : t('about.demos.cannon3d.miss')}. ${t('about.demos.cannon3d.score')} ${score}`}
          </span>
        </div>
      </div>
      <span
        ref={note}
        aria-hidden="true"
        className="absolute top-0 left-0 font-mono text-meta font-semibold text-muted opacity-0 data-[hit=true]:text-accent-ink"
      />
    </div>
  );
}
