'use client';

import { useEffect, useRef, useState } from 'react';

import { useElementSize } from '../../../hooks/useElementSize';
import { useInView } from '../../../hooks/useInView';
import { useThemeChange } from '../../../hooks/useThemeChange';
import { useTranslation } from '../../../i18n';
import type { AboutDemoProps } from '../types';
import { CannonRound } from './CannonRound';

export function CannonDemo({ copy, animate }: AboutDemoProps) {
  const { t } = useTranslation();
  const miss = t('about.demos.cannon.miss');
  const field = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLButtonElement>(null);
  const round = useRef<CannonRound | null>(null);
  const visible = useInView(field);
  const size = useElementSize(field);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !size || !canvas.current || !stage.current || !copy.current) {
      return;
    }
    const ctx = canvas.current.getContext('2d');
    if (!ctx) {
      return;
    }
    const game = new CannonRound(ctx, stage.current, copy.current, animate, miss, (points) => {
      setLast(points);
      setScore((value) => value + points);
    });
    round.current = game;
    const visibility = () => game.setActive(!document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      game.setActive(false);
      round.current = null;
    };
  }, [visible, size, copy, animate, miss]);

  useThemeChange(() => round.current?.restyle());

  return (
    <div ref={field} className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-0 container">
        <div className="absolute inset-x-6 top-14 md:top-1/2 md:left-auto md:w-72 md:-translate-y-1/2 lg:w-88">
          <button
            type="button"
            ref={stage}
            aria-label={t('about.demos.cannon.name')}
            aria-describedby="cannon-hint"
            className="pointer-events-auto block h-36 w-full cursor-pointer touch-pan-y rounded-sm select-none md:h-44"
            onPointerDown={(e) => {
              if (e.isPrimary && e.button === 0) {
                e.currentTarget.setPointerCapture(e.pointerId);
                round.current?.press();
              }
            }}
            onPointerUp={(e) => {
              if (e.isPrimary && e.button === 0) {
                round.current?.release();
              }
            }}
            onPointerCancel={() => round.current?.cancel()}
            onLostPointerCapture={() => round.current?.cancel()}
            onBlur={() => round.current?.cancel()}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!e.repeat) {
                  round.current?.press();
                }
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                round.current?.release();
              }
            }}
            onClick={(e) => {
              if (e.detail === 0 && !round.current?.busy) {
                round.current?.press();
                round.current?.release(0.5);
              }
            }}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line-strong pt-3">
            <p id="cannon-hint" className="eyebrow text-muted">
              {t('about.demos.cannon.hint')}
            </p>
            <p className="eyebrow text-muted">
              {t('about.demos.cannon.score')}
              <b className="ml-2 font-semibold text-ink tabular-nums">{score}</b>
            </p>
          </div>
          <span role="status" className="sr-only">
            {last === null
              ? ''
              : `${last ? t('about.demos.cannon.hit', { points: last }) : t('about.demos.cannon.miss')}. ${t('about.demos.cannon.score')} ${score}`}
          </span>
        </div>
      </div>
      {/* Last, so the shot flies over the copy and the panel instead of behind them. */}
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
    </div>
  );
}
