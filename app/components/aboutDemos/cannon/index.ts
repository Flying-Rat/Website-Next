'use client';

import dynamic from 'next/dynamic';

import type { AboutDemo } from '../types';

export const cannon: AboutDemo = {
  Component: dynamic(() => import('./CannonDemo').then((m) => m.CannonDemo), { ssr: false }),
  clearance: 'h-52',
  copyWidth: 'md:w-[52%] lg:w-auto',
  splitCopy: 'words',
};
