import * as THREE from 'three';

export interface SceneTheme {
  isLight: boolean;
  accent: THREE.Color;
  /** Terrain colour at the base and at the top of its height range. */
  low: THREE.Color;
  high: THREE.Color;
  /** Wireframe and depth-view ink: the page's text colour. */
  line: THREE.Color;
  /** Distance fade target: the page background, so the terrain dissolves into it. */
  fog: THREE.Color;
}

const FALLBACK = {
  light: { accent: '#e04555', bg: '#f6f6f3', text: '#0c0c0d', surface: '#ffffff' },
  dark: { accent: '#fa5565', bg: '#0a0a0b', text: '#f4f4f1', surface: '#111113' },
};

function readToken(style: CSSStyleDeclaration, name: string, fallback: string): THREE.Color {
  const raw = style.getPropertyValue(name).trim();
  try {
    return new THREE.Color(raw || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

/** Reads the active theme from the `html` class and the CSS color tokens it defines. */
export function readSceneTheme(): SceneTheme {
  const root = document.documentElement;
  const isLight = root.classList.contains('light');
  const style = getComputedStyle(root);
  const fb = isLight ? FALLBACK.light : FALLBACK.dark;

  const accent = readToken(style, isLight ? '--color-accent-dark' : '--color-accent', fb.accent);
  const fog = readToken(style, '--color-bg', fb.bg);
  const line = readToken(style, '--color-text', fb.text);
  const surface = readToken(style, '--color-surface', fb.surface);

  // Light theme: pale stone rising to white. Dark theme: graphite rising to steel.
  const low = isLight ? line.clone().lerp(fog, 0.7) : line.clone().lerp(fog, 0.86);
  const high = isLight ? surface.clone() : line.clone().lerp(fog, 0.3);

  return { isLight, accent, low, high, line, fog };
}
