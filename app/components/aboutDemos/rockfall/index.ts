'use client';

import dynamic from 'next/dynamic';

import type { AboutDemo } from '../types';

export const rockfall: AboutDemo = {
  Component: dynamic(() => import('./RockfallDemo').then((m) => m.RockfallDemo), { ssr: false }),
};
