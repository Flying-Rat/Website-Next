'use client';

import dynamic from 'next/dynamic';

import type { AboutDemo } from '../types';

export const pinball: AboutDemo = {
  Component: dynamic(() => import('./PinballDemo').then((m) => m.PinballDemo), { ssr: false }),
  clearance: 'h-96',
  copyWidth: 'md:w-[46%] xl:w-auto',
};
