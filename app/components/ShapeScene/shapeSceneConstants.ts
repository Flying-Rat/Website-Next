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
