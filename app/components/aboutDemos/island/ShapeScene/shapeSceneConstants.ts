export const DO_EXPLOSION = true; // false selects the traveling shockwave.

/** The Konami code, as lowercased `KeyboardEvent.key` values. */
export const EASTER_SEQUENCE = [
  'arrowup',
  'arrowup',
  'arrowdown',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'arrowleft',
  'arrowright',
  'b',
  'a',
];
export const EASTER_SET = new Set(EASTER_SEQUENCE);

/** Render views the scene can be switched between, in cycle order. */
export const VIEW_MODES = ['Lit', 'Wire', 'Normals', 'Depth'] as const;

/** Clouds drifting over the island. Shared with the shaders, which size an array by it. */
export const CLOUD_COUNT = 5;

/** World-space layout shared by the instanced bridge, terrain cells and lighting pass. */
export const BRIDGE = { x: 0.55, z: 1.15, halfSpan: 1.5, bankRelief: 0.42 } as const;
export const RAVINE = { halfWidth: 1.04, slope: 0.17, bend: 0.26 } as const;
export const COLUMN_BASE = 0.1;
export const COLUMN_RELIEF = 3.6;

export const TERRAIN_WAVE = { frequency: 1.5, speed: 0.9, swellFalloff: 1.5 } as const;

// Distances behind the visible front, in world units. The bridge and columns
// sample the same displacement profile so both landings follow the wave.
export const SHOCK = { relief: 0.52, peak: 0.45, tail: 1.6 } as const;

export const REBUILD_SECONDS = 2.8;
