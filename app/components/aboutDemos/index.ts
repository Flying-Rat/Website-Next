'use client';

import { useSyncExternalStore } from 'react';

import { cannon } from './cannon';
import { cannon3d } from './cannon3d';
import { island } from './island';
import { pinball } from './pinball';
import { rockfall } from './rockfall';
import type { AboutDemo } from './types';

export type { AboutDemo, AboutDemoProps } from './types';

/**
 * Every demo, under the name that picks it in the URL. A demo is one folder and
 * one line here; nothing else in the app refers to it.
 */
const DEMOS: Record<string, AboutDemo> = { island, cannon, cannon3d, rockfall, pinball };
const DEFAULT_DEMO = island;
/** `/?demo=cannon3d` swaps the demo. A query, because the hash already names a section. */
const DEMO_PARAM = 'demo';

function subscribeToNothing() {
  return () => {};
}

function requestedDemo(): AboutDemo {
  const name = new URLSearchParams(window.location.search).get(DEMO_PARAM) ?? '';
  return Object.hasOwn(DEMOS, name) ? DEMOS[name] : DEFAULT_DEMO;
}

/**
 * The demo this visit asked for. The page is prerendered without a query, so the
 * server and the first client render both use the default.
 */
export function useAboutDemo(): AboutDemo {
  return useSyncExternalStore(subscribeToNothing, requestedDemo, () => DEFAULT_DEMO);
}
