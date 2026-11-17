/**
 * Shaders for the About scene. Five draw calls: a tiny data pass that works out
 * every column once, then the terrain, the props standing on and floating over it
 * (trees and clouds), the ground grid and the atmosphere motes.
 * Everything that moves is a function of time evaluated on the GPU, so no buffer
 * is ever re-uploaded after start-up.
 */

import { CLOUD_COUNT } from './shapeSceneConstants';

/** The pulse ring is drawn by both the terrain and the grid; they must agree on its shape. */
const pulseRing = /* glsl */ `
  // x: radius of the travelling ring, y: its strength.
  uniform vec2 uPulse;

  float pulseRing(float fromCenter) {
    float offset = (fromCenter - uPulse.x) / 0.3;
    return uPulse.y * exp(-offset * offset);
  }
`;

/** How relief (a unitless 0..~1.4 figure) becomes a column height in world units. */
const columnScale = /* glsl */ `
  const float BASE_HEIGHT = 0.1;
  const float RELIEF = 3.6;
`;

/** The swell that follows the cursor, or wanders when there is none. */
const swell = /* glsl */ `
  // xy: where the swell sits on the ground, z: its strength.
  uniform vec3 uPointer;

  float pointerLift(vec2 p) {
    vec2 toPointer = p - uPointer.xy;
    return uPointer.z * exp(-dot(toPointer, toPointer) / 1.5);
  }
`;

/**
 * The data pass writes to a plain 8-bit RGBA target, which every WebGL2 device can
 * render to (float targets need an extension). Relief needs more than 8 bits or the
 * columns would visibly step, so it is split across two channels as a 16-bit value.
 */
const reliefPacking = /* glsl */ `
  const float RELIEF_RANGE = 2.0;

  vec2 packRelief(float relief) {
    float steps = floor(clamp(relief / RELIEF_RANGE, 0.0, 1.0) * 65535.0 + 0.5);
    float high = floor(steps / 256.0);
    return vec2(high, steps - high * 256.0) / 255.0;
  }

  float unpackRelief(vec2 channels) {
    vec2 bytes = floor(channels * 255.0 + 0.5);
    return (bytes.x * 256.0 + bytes.y) / 65535.0 * RELIEF_RANGE;
  }
`;

/** Where the clouds are this frame; the data pass shades under them, the props pass draws them. */
const clouds = /* glsl */ `
  // xyz: a cloud's centre, w: its size, which eases to zero where it enters and leaves.
  uniform vec4 uClouds[${CLOUD_COUNT}];
`;

/**
 * Reading the data pass back: what it recorded for a grid cell, and how tall that
 * cell's column stands. Anything that sits on the terrain must agree with it.
 */
const columnLookup = /* glsl */ `
  uniform sampler2D uColumns;
  uniform float uColumnsAcross;
  uniform float uRadius;
  uniform float uTime;
  uniform float uBoost;
  ${columnScale}
  ${reliefPacking}

  // rg: relief, b: sunlight, a: openness.
  vec4 columnData(vec2 cell) {
    // Cell centres sit half a cell in from the edge, so truncating finds the texel.
    ivec2 texel = ivec2((cell + uRadius) / (2.0 * uRadius) * uColumnsAcross);
    return texelFetch(uColumns, texel, 0);
  }

  // Easter-egg chaos: every column pulses on a phase of its own, hashed from its cell.
  float chaosRelief(vec2 cell, float relief) {
    float phase = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
    return relief * (1.0 + uBoost * (0.6 + 0.5 * sin(uTime * 7.0 + phase * 6.2831)));
  }
`;

/**
 * Everything a box needs to appear in each render view: its face normal, its
 * edges, and the mode switch itself. The view modes are branches of one function,
 * so two of them can share the screen while a wipe crosses it without a second pass.
 */
const viewModes = /* glsl */ `
  uniform vec3 uLine;
  uniform vec3 uFog;
  uniform vec2 uFogRange;
  uniform vec2 uDepthRange;
  // x: the incoming view mode, y: the outgoing one.
  uniform vec2 uModes;
  // Device-pixel x of the wipe; the incoming mode is drawn to its right.
  uniform float uWipeX;

  // Position within the unit box, and distance from the camera.
  varying vec3 vLocal;
  varying float vViewDepth;

  float viewMode() {
    return gl_FragCoord.x > uWipeX ? uModes.x : uModes.y;
  }

  // The box carries no normals and shares its eight corners between faces, so the
  // face normal is recovered from how the local position changes across the screen.
  // A box face is flat along exactly one local axis, which makes the result one-hot.
  vec3 faceNormal() {
    vec3 n = cross(dFdx(vLocal), dFdy(vLocal));
    vec3 magnitude = abs(n);
    float dominant = max(magnitude.x, max(magnitude.y, magnitude.z));
    return sign(n) * step(dominant * 0.5, magnitude);
  }

  // Distance to the nearest box edge, in screen pixels.
  float edgeDistance(vec3 normal) {
    vec3 d = (0.5 - abs(vLocal)) / max(fwidth(vLocal), vec3(1e-5));
    // The axis along the face normal sits exactly on the surface: ignore it.
    d += abs(normal) * 1e4;
    return min(min(d.x, d.y), d.z);
  }

  // The pixel's colour in the given view. lit is the shaded surface (only read in
  // the lit view); ink.rgb and ink.a are the wireframe's colour and strength.
  vec3 viewColor(float mode, vec3 normal, vec3 lit, vec4 ink) {
    float fog = smoothstep(uFogRange.x, uFogRange.y, vViewDepth);
    if (mode < 0.5) {
      return mix(lit, uFog, fog);
    }
    if (mode < 1.5) {
      // Hidden-line wireframe: faces are filled with the background so only the
      // nearest edges show, instead of thousands of see-through boxes.
      float coverage = 1.0 - smoothstep(0.35, 1.25, edgeDistance(normal));
      return mix(uFog, ink.rgb, coverage * (1.0 - fog * 0.8) * ink.a);
    }
    if (mode < 2.5) {
      // The classic normal view: remap [-1, 1] to RGB (in display space).
      return mix(pow(normal * 0.5 + 0.5, vec3(2.2)), uFog, fog * 0.55);
    }
    float near = 1.0 - smoothstep(uDepthRange.x, uDepthRange.y, vViewDepth);
    return mix(uFog, uLine, near * near);
  }
`;

/** Shading constants shared by everything that is lit. */
const lighting = /* glsl */ `
  // Unit vector toward the light.
  uniform vec3 uLight;

  // Light left on a surface the sun does not reach.
  const float SHADE = 0.44;
`;

/**
 * The height field and the two lighting terms derived from it. This is the
 * expensive part of the scene, which is why it runs in the data pass (once per
 * column) and not in the terrain's vertex shader (eight times per column).
 */
const heightField = /* glsl */ `
  uniform float uTime;
  uniform float uRadius;
  uniform float uBoost;
  // xy: unit direction along the ground toward the light, z: how fast a ray toward it climbs.
  uniform vec3 uSun;
  ${swell}
  ${columnScale}
  ${clouds}

  // How much light a cloud takes from the ground in the middle of its shadow.
  const float CLOUD_SHADE = 0.6;

  // Shadow rays: each step reaches further than the last, because nearby terrain
  // matters most. Seven steps cover a little over four world units.
  const int SHADOW_STEPS = 7;
  const float SHADOW_FIRST_STEP = 0.3;
  const float SHADOW_STEP_GROWTH = 1.55;
  // Higher is a harder shadow edge.
  const float SHADOW_SHARPNESS = 5.0;
  // Crevice shading looks this far to each side, and treats a column sunk this
  // deep below its surroundings (in relief units) as fully enclosed.
  const float CREVICE_REACH = 0.5;
  const float CREVICE_DEPTH = 0.11;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float gradientNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Quintic fade: its second derivative is continuous across lattice cells. The
    // crevice shading compares a column with its neighbours, which amounts to a
    // second difference, and the usual cubic fade would show up there as seams.
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(
        dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)),
        u.x
      ),
      u.y
    );
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 3; octave++) {
      sum += amplitude * gradientNoise(p);
      p = p * 2.03 + vec2(17.3, -9.1);
      amplitude *= 0.5;
    }
    return sum;
  }

  // The terrain's relief at any point on the ground, not only at column centres:
  // shadow rays and crevice samples land between columns.
  float reliefAt(vec2 p) {
    float fromCenter = length(p);
    // The island tapers to a low shelf at its rim.
    float rim = 1.0 - smoothstep(0.5, 1.0, fromCenter / uRadius);

    vec2 drift = vec2(uTime * 0.07, -uTime * 0.045);
    float ridges = pow(clamp(0.5 + fbm(p * 0.3 + drift) * 1.7, 0.0, 1.0), 1.6);
    float ripple = 0.5 + 0.5 * sin(fromCenter * 1.5 - uTime * 0.9);

    return rim * (ridges * 0.9 + ripple * 0.07) + pointerLift(p) * 0.42;
  }

  // How much of the light reaches a column top: 1 in the open, 0 in full shadow.
  // A ray is marched from the top toward the light through the height function
  // itself, so there is no shadow map and nothing to keep in sync with the terrain.
  float sunlight(vec2 cell, float relief, float stretch) {
    float top = BASE_HEIGHT + relief * stretch;
    float lit = 1.0;
    float reach = SHADOW_FIRST_STEP;
    for (int i = 0; i < SHADOW_STEPS; i++) {
      float ray = top + uSun.z * reach;
      float ground = BASE_HEIGHT + reliefAt(cell + uSun.xy * reach) * stretch;
      // Clearance over distance is the angle by which the ray misses the terrain:
      // a near miss gives a penumbra, a hit gives full shadow.
      lit = min(lit, (ray - ground) * SHADOW_SHARPNESS / reach);
      reach *= SHADOW_STEP_GROWTH;
    }
    lit = clamp(lit, 0.0, 1.0);

    // Cloud shadows: follow the same ray up to each cloud's altitude and see how
    // close to the cloud's middle it passes.
    for (int i = 0; i < ${CLOUD_COUNT}; i++) {
      vec4 cloud = uClouds[i];
      vec2 pierce = cell + uSun.xy * ((cloud.y - top) / uSun.z);
      float cover = 1.0 - smoothstep(0.45, 1.25, distance(pierce, cloud.xz) / max(cloud.w, 1e-3));
      lit *= 1.0 - CLOUD_SHADE * cover * step(1e-3, cloud.w);
    }
    return lit;
  }

  // How open a column is to the sky: 1 on a ridge or a plain, 0 at the bottom of
  // a pit. Ambient light reaches a surface from all around, so ground that sits
  // below its neighbours receives less of it. Four samples of the height function
  // stand in for that, with no screen-space pass.
  float openness(vec2 cell, float relief) {
    vec2 reach = vec2(CREVICE_REACH, 0.0);
    float surroundings = 0.25 * (
      reliefAt(cell + reach.xy) + reliefAt(cell - reach.xy) +
      reliefAt(cell + reach.yx) + reliefAt(cell - reach.yx)
    );
    return 1.0 - smoothstep(0.0, CREVICE_DEPTH, surroundings - relief);
  }
`;

/**
 * Data pass: one fragment per grid cell, drawn into a texture as small as the grid
 * (80 x 80 on desktop). It evaluates the height field, the shadow ray and the
 * crevice samples once per column. Doing the same in the terrain's vertex shader
 * would repeat all of it for each of a column's eight corners.
 *
 * Output: rg = relief (16 bits), b = sunlight, a = openness to the sky.
 */
export const columnDataVertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const columnDataFragmentShader = /* glsl */ `
  uniform float uColumnsAcross;
  ${heightField}
  ${reliefPacking}

  void main() {
    // Texel (column, row) holds the grid cell of the same index; this is its centre.
    vec2 cell = (floor(gl_FragCoord.xy) + 0.5) / uColumnsAcross * (2.0 * uRadius) - uRadius;
    float relief = reliefAt(cell);
    // The chaos mode stretches every column by its own amount; shadows use the average.
    float stretch = RELIEF * (1.0 + uBoost * 0.6);

    gl_FragColor = vec4(
      packRelief(relief),
      sunlight(cell, relief, stretch),
      openness(cell, relief)
    );
  }
`;

/**
 * Terrain: one instanced draw call. Each column looks up what the data pass
 * worked out for its cell, and everything that is constant across a column
 * travels to the fragment shader as a `flat` varying (no interpolation).
 */
export const terrainVertexShader = /* glsl */ `
  attribute vec2 aCell;

  uniform float uCell;
  ${columnLookup}
  ${swell}
  ${pulseRing}

  varying vec3 vLocal;
  varying float vViewDepth;
  flat varying float vRelief;
  flat varying float vAccent;
  flat varying float vColumnHeight;
  flat varying float vSunlit;
  flat varying float vOpen;

  void main() {
    vec4 column = columnData(aCell);
    float fromCenter = length(aCell);
    float lift = pointerLift(aCell);
    float relief = chaosRelief(aCell, unpackRelief(column.rg));
    float height = BASE_HEIGHT + relief * RELIEF;

    vec4 viewPosition = viewMatrix * vec4(
      aCell.x + position.x * uCell,
      (position.y + 0.5) * height,
      aCell.y + position.z * uCell,
      1.0
    );
    gl_Position = projectionMatrix * viewPosition;

    vLocal = position;
    vViewDepth = -viewPosition.z;
    vRelief = clamp(relief, 0.0, 1.0);
    vAccent = clamp(
      max(smoothstep(0.46, 0.74, relief), lift * 0.9) + uBoost * 0.6 + pulseRing(fromCenter) * 0.17,
      0.0,
      1.0
    );
    vColumnHeight = height;
    vSunlit = column.b;
    vOpen = column.a;
  }
`;

/**
 * The view modes are branches of one shader, so two of them can share the screen
 * while a wipe crosses it without a second pass.
 */
export const terrainFragmentShader = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform vec3 uAccent;
  // Contours per world unit of height.
  uniform float uContourFrequency;
  ${viewModes}
  ${lighting}

  flat varying float vRelief;
  flat varying float vAccent;
  flat varying float vColumnHeight;
  flat varying float vSunlit;
  flat varying float vOpen;

  // Light left at the bottom of a fully enclosed crevice.
  const float CREVICE = 0.58;

  vec3 shadeLit(vec3 normal) {
    float diffuse = max(dot(normal, uLight), 0.0);
    float isTop = step(0.5, normal.y);
    // Sides darken toward the base, a cheap stand-in for ambient occlusion.
    float along = clamp(vLocal.y + 0.5, 0.0, 1.0);
    float side = mix(0.3, 0.72, along) * (0.7 + 0.55 * diffuse);
    float light = mix(side, 1.0, isTop) * mix(SHADE, 1.0, vSunlit) * mix(CREVICE, 1.0, vOpen);

    vec3 albedo = mix(uLow, uHigh, smoothstep(0.02, 0.75, vRelief));
    // Elevation contours, as on a survey map: columns whose height lands near a
    // multiple of the step get their tops inked, so the bands flow as the terrain does.
    float contour = smoothstep(0.38, 0.5, abs(fract(vColumnHeight * uContourFrequency) - 0.5));
    albedo = mix(albedo, uLine, contour * isTop * 0.2);
    albedo = mix(albedo, uAccent, vAccent);
    return albedo * light;
  }

  void main() {
    float mode = viewMode();
    vec3 normal = faceNormal();
    vec3 lit = mode < 0.5 ? shadeLit(normal) : vec3(0.0);
    vec4 ink = vec4(mix(uLine, uAccent, vAccent), mix(0.5, 0.95, vAccent));

    gl_FragColor = vec4(viewColor(mode, normal, lit, ink), 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Props: trees and clouds, one instanced draw call of the same unit box as the
 * terrain. A tree stands on its cell's column and grows or shrinks with how suitable
 * that cell is right now; a cloud block rides its cloud. Both go through the same
 * view modes as the terrain, so every render view shows them.
 */
export const propVertexShader = /* glsl */ `
  // xy: the tree's cell, or the block's offset from its cloud; z: cloud index, -1 for trees.
  attribute vec3 aAnchor;
  // x: width, y: height, z: lift above the anchor, w: tint.
  attribute vec4 aBox;

  ${columnLookup}
  ${clouds}

  varying vec3 vLocal;
  varying float vViewDepth;
  flat varying float vTint;
  flat varying float vSunlit;

  void main() {
    vec3 foot;
    float grow;
    float sunlit = 1.0;

    if (aAnchor.z < 0.0) {
      vec4 column = columnData(aAnchor.xy);
      float relief = unpackRelief(column.rg);
      // Trees keep to the middle slopes, out of the pits and off the peaks and shore.
      grow =
        smoothstep(0.07, 0.15, relief) *
        (1.0 - smoothstep(0.34, 0.45, relief)) *
        smoothstep(0.3, 0.75, column.a);
      foot = vec3(aAnchor.x, BASE_HEIGHT + chaosRelief(aAnchor.xy, relief) * RELIEF, aAnchor.y);
      sunlit = column.b;
    } else {
      vec4 cloud = uClouds[int(aAnchor.z)];
      grow = cloud.w;
      foot = cloud.xyz + vec3(aAnchor.x, 0.0, aAnchor.y) * grow;
    }

    vec3 size = vec3(aBox.x, aBox.y, aBox.x) * grow;
    vec4 viewPosition = viewMatrix * vec4(
      foot + vec3(position.x * size.x, aBox.z * grow + (position.y + 0.5) * size.y, position.z * size.z),
      1.0
    );
    gl_Position = projectionMatrix * viewPosition;

    vLocal = position;
    vViewDepth = -viewPosition.z;
    vTint = aBox.w;
    vSunlit = sunlit;
  }
`;

export const propFragmentShader = /* glsl */ `
  uniform vec3 uHigh;
  uniform vec3 uAccent;
  ${viewModes}
  ${lighting}

  flat varying float vTint;
  flat varying float vSunlit;

  // Tints, in the order the geometry numbers them: trunk, crown, accent crown, cloud.
  vec3 tintColor() {
    if (vTint < 0.5) return mix(uLine, uFog, 0.12);
    if (vTint < 1.5) return mix(uLine, uFog, 0.36);
    if (vTint < 2.5) return uAccent;
    return uHigh;
  }

  void main() {
    float mode = viewMode();
    vec3 normal = faceNormal();
    vec3 tint = tintColor();

    float diffuse = max(dot(normal, uLight), 0.0);
    float light = mix(0.5 + 0.45 * diffuse, 1.0, step(0.5, normal.y)) * mix(SHADE, 1.0, vSunlit);

    // Clouds are the page's lightest colour, which would vanish as wireframe on a
    // light page, so their outlines are drawn in the same ink as the terrain's.
    vec3 ink = vTint > 2.5 ? uLine : tint;

    gl_FragColor = vec4(viewColor(mode, normal, tint * light, vec4(ink, 0.8)), 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Ground grid under the terrain: an editor-style reference plane. Lines are drawn
 * analytically (one disc, no line geometry), stay a constant width on screen, and
 * dissolve toward the rim so the plane has no visible edge.
 */
export const gridVertexShader = /* glsl */ `
  varying vec2 vGround;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vGround = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const gridFragmentShader = /* glsl */ `
  uniform vec3 uLine;
  uniform vec3 uAccent;
  uniform vec3 uLow;
  uniform float uOpacity;
  uniform float uSpacing;
  uniform float uRadius;
  uniform float uIsland;
  uniform float uPool;
  ${pulseRing}

  varying vec2 vGround;

  // Coverage of grid lines at the given cell size, one pixel wide.
  float gridLines(float spacing) {
    vec2 cell = vGround / spacing;
    vec2 footprint = fwidth(cell);
    vec2 d = abs(fract(cell - 0.5) - 0.5) / max(footprint, vec2(1e-5));
    float line = 1.0 - min(min(d.x, d.y), 1.0);
    // Where cells shrink to a pixel or less the lines would merge into a haze: drop them.
    return line * (1.0 - smoothstep(0.25, 0.8, max(footprint.x, footprint.y)));
  }

  void main() {
    float fromCenter = length(vGround);
    float lines = max(gridLines(uSpacing) * 0.45, gridLines(uSpacing * 4.0));
    float rim = 1.0 - smoothstep(uRadius * 0.42, uRadius, fromCenter);

    float ring = pulseRing(fromCenter);

    float pool = (1.0 - smoothstep(uIsland * 0.7, uIsland * 1.45, fromCenter)) * uPool;

    float lineAlpha = lines * rim * rim * (uOpacity + ring * 0.26);
    float alpha = lineAlpha + pool * (1.0 - lineAlpha);
    vec3 color = mix(uLine, uAccent, ring * lines);

    // Under the island the ground is solid, in the terrain's own shaded colour. The
    // columns stand slightly apart, and when the camera lines up with the grid the
    // gaps between them form a slit straight through the island; this closes it.
    float underIsland = 1.0 - smoothstep(uIsland - 0.2, uIsland - 0.05, fromCenter);
    color = mix(color, uLow * 0.55, underIsland);
    alpha = mix(alpha, 1.0, underIsland);
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

export const moteVertexShader = /* glsl */ `
  attribute float aSeed;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReferenceDistance;
  uniform float uCeiling;

  varying float vAlpha;
  varying float vAccent;

  void main() {
    // Rise from the ground to the ceiling, then start over; the fade below hides the wrap.
    float rise = fract(position.y / uCeiling + uTime * (0.01 + aSeed * 0.012));
    vec4 viewPosition = viewMatrix * vec4(
      position.x + sin(uTime * 0.23 + aSeed * 40.0) * 0.3,
      0.15 + rise * uCeiling,
      position.z + cos(uTime * 0.19 + aSeed * 23.0) * 0.3,
      1.0
    );
    gl_Position = projectionMatrix * viewPosition;

    float size = mix(2.2, 5.6, fract(aSeed * 7.31));
    gl_PointSize = size * uPixelRatio * (uReferenceDistance / -viewPosition.z);

    float life = smoothstep(0.0, 0.18, rise) * (1.0 - smoothstep(0.7, 1.0, rise));
    float twinkle = 0.7 + 0.3 * sin(uTime * 1.1 + aSeed * 61.0);
    vAlpha = life * twinkle;
    vAccent = step(0.86, fract(aSeed * 13.7));
  }
`;

export const moteFragmentShader = /* glsl */ `
  uniform vec3 uLine;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform vec2 uModes;
  uniform float uWipeX;

  varying float vAlpha;
  varying float vAccent;

  void main() {
    // Dust belongs to the picture, not to the data: it is only drawn in the lit
    // and wireframe views, and obeys the same wipe as the terrain.
    float mode = gl_FragCoord.x > uWipeX ? uModes.x : uModes.y;
    if (mode > 1.5) discard;

    float disc = 1.0 - smoothstep(0.1, 0.5, length(gl_PointCoord - 0.5));
    float alpha = disc * vAlpha * uOpacity;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(mix(uLine, uAccent, vAccent), alpha);
    #include <colorspace_fragment>
  }
`;
