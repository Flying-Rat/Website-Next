'use client';

import { useState } from 'react';

import { useTranslation } from '../../../i18n';
import { DEMO_SCENE, DemoHud } from '../DemoHud';
import type { AboutDemoProps } from '../types';
import { ShapeScene } from './ShapeScene';
import { DO_EXPLOSION } from './ShapeScene/shapeSceneConstants';

export function IslandDemo({ animate }: AboutDemoProps) {
  const { t } = useTranslation();
  // The scene draws its own controls into the shared plates, under the island.
  const [hudTarget, setHudTarget] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <div className={`about-scene ${DEMO_SCENE}`}>
        <ShapeScene
          label={t(DO_EXPLOSION ? 'about.demos.island.explosion' : 'about.demos.island.title')}
          shouldAnimate={animate}
          className="relative h-full w-full overflow-hidden"
          hudTarget={hudTarget}
        />
      </div>

      <DemoHud>
        <div ref={setHudTarget} className="contents" />
      </DemoHud>
    </>
  );
}
