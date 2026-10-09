import * as THREE from 'three';

export interface SceneTheme {
  isLight: boolean;
  accent: THREE.Color;
  steel: THREE.Color;
  fog: THREE.Color;
  grid: THREE.Color;
}

const FALLBACK = {
  light: { accent: '#e04555', bg: '#fafafa', text: '#0a0a0a' },
  dark: { accent: '#fa5565', bg: '#000000', text: '#ffffff' },
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
  const text = readToken(style, '--color-text', fb.text);
  // Neutral shape color: the text color pulled slightly toward the background.
  const steel = text.clone().lerp(fog, 0.18);

  return { isLight, accent, steel, fog, grid: text };
}
