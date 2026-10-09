'use client';

import { useEffect, useReducer, useRef } from 'react';

import { EASTER_SEQUENCE, EASTER_SET } from './shapeSceneGeometry';

export type KeyEntry = { id: string; key: string };

type EasterState = { active: boolean; inputKeys: KeyEntry[] };
type EasterAction =
  | { type: 'activate' }
  | { type: 'deactivate' }
  | { type: 'keys'; keys: KeyEntry[] };

const EASTER_DURATION_MS = 5000;

function easterReducer(state: EasterState, action: EasterAction): EasterState {
  switch (action.type) {
    case 'activate':
      return { active: true, inputKeys: [] };
    case 'deactivate':
      return { active: false, inputKeys: [] };
    case 'keys':
      return { active: state.active, inputKeys: action.keys };
  }
}

/**
 * Listens for the Konami code. While active, `boostRef.current` is true (read by the
 * render loop without re-rendering) and the `crt-mode` class is set on `<html>`.
 */
export function useEasterEgg(enabled: boolean) {
  const [state, dispatch] = useReducer(easterReducer, { active: false, inputKeys: [] });
  const boostRef = useRef(false);
  const entriesRef = useRef<KeyEntry[]>([]);
  const keyIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const deactivate = () => {
      boostRef.current = false;
      dispatch({ type: 'deactivate' });
      document.documentElement.classList.remove('crt-mode');
    };

    if (!enabled) {
      deactivate();
      return;
    }

    const activate = () => {
      boostRef.current = true;
      dispatch({ type: 'activate' });
      document.documentElement.classList.add('crt-mode');
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(deactivate, EASTER_DURATION_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!EASTER_SET.has(key)) {
        return;
      }

      keyIdRef.current += 1;
      const entries = [...entriesRef.current, { id: `key-${keyIdRef.current}`, key }].slice(
        -EASTER_SEQUENCE.length,
      );
      const matches =
        entries.length === EASTER_SEQUENCE.length &&
        entries.every((entry, idx) => entry.key === EASTER_SEQUENCE[idx]);

      if (matches) {
        entriesRef.current = [];
        activate();
      } else {
        entriesRef.current = entries;
        dispatch({ type: 'keys', keys: entries });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      deactivate();
    };
  }, [enabled]);

  return { active: state.active, inputKeys: state.inputKeys, boostRef };
}
