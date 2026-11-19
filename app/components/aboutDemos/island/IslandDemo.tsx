'use client';

import { useState } from 'react';

import { useTranslation } from '../../../i18n';
import type { AboutDemoProps } from '../types';
import { ShapeScene } from './ShapeScene';
import { DO_EXPLOSION } from './ShapeScene/shapeSceneConstants';

export function IslandDemo({ animate }: AboutDemoProps) {
  const { t } = useTranslation();
  // The scene's controls are mounted inside the page container so they line up
  // with the copy, while the canvas itself bleeds to the viewport edge.
  const [hudTarget, setHudTarget] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <div className="about-scene absolute inset-x-0 top-0 h-[21rem] md:inset-y-0 md:left-[36%] md:h-auto">
        <ShapeScene
          label={t(DO_EXPLOSION ? 'about.demos.island.explosion' : 'about.demos.island.title')}
          shouldAnimate={animate}
          className="relative h-full w-full overflow-hidden"
          hudTarget={hudTarget}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="relative container h-full">
          <div
            ref={setHudTarget}
            className="absolute top-[17.5rem] left-6 md:top-auto md:right-6 md:bottom-12 md:left-auto"
          />
        </div>
      </div>
    </>
  );
}
