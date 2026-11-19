'use client';

import { cannon3d } from './cannon3d';
import { type DemoName, useDemoName } from './choice';
import { island } from './island';
import { rockfall } from './rockfall';
import type { AboutDemo } from './types';

export type { AboutDemo, AboutDemoProps } from './types';

/**
 * Every demo, under the name that picks it. A demo is one folder, one line here
 * and its name in `choice.ts`; nothing else in the app refers to it.
 */
const DEMOS: Record<DemoName, AboutDemo> = { island, cannon3d, rockfall };

export function useAboutDemo(): AboutDemo {
  return DEMOS[useDemoName()];
}
