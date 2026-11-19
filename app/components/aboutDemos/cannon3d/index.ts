'use client';

import dynamic from 'next/dynamic';

import type { AboutDemo } from '../types';

export const cannon3d: AboutDemo = {
  Component: dynamic(() => import('./Cannon3dDemo').then((m) => m.Cannon3dDemo), { ssr: false }),
  splitCopy: 'letters',
  section: 'cursor-crosshair',
};
