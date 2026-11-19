'use client';

import dynamic from 'next/dynamic';

import type { AboutDemo } from '../types';

/**
 * Its chunk is the largest on the site, which is why every demo is loaded lazily.
 * Its styles are the `about` and `scene` blocks in `globals.css`.
 */
export const island: AboutDemo = {
  Component: dynamic(() => import('./IslandDemo').then((m) => m.IslandDemo), { ssr: false }),
};
