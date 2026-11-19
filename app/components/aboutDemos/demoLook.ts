import { Color } from 'three';

/**
 * The look every demo shares, so switching between them changes the subject and
 * not the style. Things are built from boxes and shaded softly, with no drawn
 * outlines; they take the page's own tones, with coral as the one accent; and
 * they stand on a ruled floor that dissolves into the page.
 */

export interface DemoLook {
  isLight: boolean;
  accent: Color;
  /** Stone at the foot of a scene and at the top of its height range. */
  low: Color;
  high: Color;
  /** The page's text colour: the floor's rules, and the darkest things in a scene. */
  line: Color;
  /** The page background, which distance and shadows fade toward. */
  fog: Color;
}

const FALLBACK = {
  light: { accent: '#e04555', bg: '#f6f6f3', text: '#0c0c0d', surface: '#ffffff' },
  dark: { accent: '#fa5565', bg: '#0a0a0b', text: '#f4f4f1', surface: '#111113' },
};

function readToken(style: CSSStyleDeclaration, name: string, fallback: string): Color {
  const raw = style.getPropertyValue(name).trim();
  try {
    return new Color(raw || fallback);
  } catch {
    return new Color(fallback);
  }
}

/** Reads the active theme from the `html` class and the CSS color tokens it defines. */
export function readDemoLook(): DemoLook {
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

/**
 * The rats' fur and what shows against it, their eyes. Stone is pale at its top
 * on both themes, so the fur is the darker of the page's two tones on both.
 */
export function ratTones(look: DemoLook): { fur: Color; eye: Color } {
  return look.isLight
    ? { fur: look.line.clone().lerp(look.fog, 0.12), eye: look.fog.clone() }
    : { fur: look.fog.clone().lerp(look.line, 0.02), eye: look.line.clone() };
}

/**
 * How strongly the floor's rules are inked. Thin light marks on near-black lose
 * most of their contrast on a real display, so the dark theme runs far stronger.
 */
export function floorInk(look: DemoLook): number {
  return look.isLight ? 0.26 : 0.6;
}

/**
 * The light on a box. A face turned up takes all of it; a side takes less the
 * further it is turned from the light, and darkens toward its foot, a cheap
 * stand-in for ambient occlusion. `along` runs from 0 at the foot to 1 at the top.
 */
export const blockLight = /* glsl */ `
  float blockLight(vec3 normal, vec3 light, float along) {
    float diffuse = max(dot(normal, light), 0.0);
    float side = mix(0.3, 0.72, along) * (0.7 + 0.55 * diffuse);
    return mix(side, 1.0, smoothstep(0.3, 0.8, normal.y));
  }
`;

/**
 * The floor's rules, drawn analytically on one flat piece of geometry: they stay
 * a pixel wide at any distance, and every `major`th one is drawn at full strength.
 */
export const floorGrid = /* glsl */ `
  float ruledLines(vec2 ground, float spacing) {
    vec2 cell = ground / spacing;
    vec2 footprint = fwidth(cell);
    vec2 d = abs(fract(cell - 0.5) - 0.5) / max(footprint, vec2(1e-5));
    float line = 1.0 - min(min(d.x, d.y), 1.0);
    // Where cells shrink to a pixel or less the lines would merge into a haze: drop them.
    return line * (1.0 - smoothstep(0.25, 0.8, max(footprint.x, footprint.y)));
  }

  float floorGrid(vec2 ground, float spacing, float major) {
    return max(ruledLines(ground, spacing) * 0.45, ruledLines(ground, spacing * major));
  }
`;
