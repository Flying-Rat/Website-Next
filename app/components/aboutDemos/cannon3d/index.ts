'use client';

import dynamic from 'next/dynamic';

import type { AboutDemo } from '../types';

export const cannon3d: AboutDemo = {
  Component: dynamic(() => import('./Cannon3dDemo').then((m) => m.Cannon3dDemo), { ssr: false }),
  clearance: 'h-72',
  // Two thirds for the copy, the last third for the cannon.
  copyWidth: 'md:w-2/3 md:max-w-none md:pr-12',
  splitCopy: 'letters',
  section: 'cursor-crosshair',
};
