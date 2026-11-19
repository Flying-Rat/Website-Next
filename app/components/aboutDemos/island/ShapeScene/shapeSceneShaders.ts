/**
 * Shaders for the About scene. Five draw calls: a tiny data pass that works out
 * every column once, then the terrain, the props standing on and floating over it
 * (bridge, trees and clouds), the ground grid and the atmosphere motes.
 * Everything that moves is a function of time evaluated on the GPU, so no buffer
 * is ever re-uploaded after start-up.
 */

import { blockLight, floorGrid } from '../../demoLook';
import {
  BRIDGE,
  CLOUD_COUNT,
  COLUMN_BASE,
  COLUMN_RELIEF,
  DO_EXPLOSION,
  RAVINE,
  REBUILD_SECONDS,
  SHOCK,
  TERRAIN_WAVE,
} from './shapeSceneConstants';

/** The pulse ring is drawn by both the terrain and the grid; they must agree on its shape. */
const pulseRing = /* glsl */ `
  // xy: origin on the ground, z: radius, w: strength.
  uniform vec4 uPulse;

  float pulseRing(vec2 point) {
    float offset = (distance(point, uPulse.xy) - uPulse.z) / 0.3;
    return uPulse.w * exp(-offset * offset);
  }
`;

/** How relief (a unitless 0..~1.4 figure) becomes a column height in world units. */
const columnScale = /* glsl */ `
  const float BASE_HEIGHT = ${COLUMN_BASE};
  const float RELIEF = ${COLUMN_RELIEF};
`;

/** The swell that follows the cursor, or wanders when there is none. */
const swell = /* glsl */ `
  // xy: where the swell sits on the ground, z: its strength.
  uniform vec3 uPointer;

  float pointerLift(vec2 p) {
    vec2 toPointer = p - uPointer.xy;
    return uPointer.z * exp(-dot(toPointer, toPointer) / ${TERRAIN_WAVE.swellFalloff});
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

/** Level approaches blend back into the animated terrain beyond the span. */
const bridgeApproach = /* glsl */ `
  float naturalGround(vec2 p) {
    vec2 edge = abs(p - vec2(${BRIDGE.x}, ${BRIDGE.z})) - vec2(${BRIDGE.halfSpan + 0.22}, 0.59);
    return smoothstep(0.0, 0.75, max(edge.x, edge.y));
  }
`;

/** One plane supports both banks and every plank, post and rail. */
const bridgeWave = /* glsl */ `
  uniform vec2 uBridgeLift;
  float bridgeLift(float x) {
    float span = clamp((x - ${BRIDGE.x} + ${BRIDGE.halfSpan}) / ${(2 * BRIDGE.halfSpan).toFixed(2)}, 0.0, 1.0);
    return mix(uBridgeLift.x, uBridgeLift.y, span);
  }
`;

// The landing already includes the deck's lift in reliefAt().
const terrainShock = /* glsl */ `
  uniform float uShockStrength;

  float shockLift(vec2 cell) {
    if (uShockStrength == 0.0) return 0.0;
    float behind = uPulse.z - distance(cell, uPulse.xy);
    float crest = smoothstep(0.0, ${SHOCK.peak}, behind) * (1.0 - smoothstep(${SHOCK.peak}, ${SHOCK.tail}, behind));
    return ${SHOCK.relief} * uShockStrength * crest * naturalGround(cell);
  }
`;

const blastLookup = DO_EXPLOSION
  ? /* glsl */ `
  uniform sampler2D uBlastMap;
  uniform float uHasBlast;
  uniform float uBlastTime;

  ivec2 terrainTexel(vec2 cell) {
    ivec2 grid = textureSize(uBlastMap, 0).xx;
    ivec2 texel = ivec2((cell / (2.0 * uRadius) + 0.5) * vec2(grid));
    return clamp(texel, ivec2(0), grid - 1);
  }
  vec4 blastRecord(vec2 cell) {
    return texelFetch(uBlastMap, terrainTexel(cell), 0);
  }
  float groundFraction(vec4 block) {
    if (block.w == 0.0) return 1.0;
    if (block.w == -1.0) return smoothstep(0.0, ${REBUILD_SECONDS}, uBlastTime - block.x);
    return 0.0;
  }

`
  : '';

const blastTransform = DO_EXPLOSION
  ? /* glsl */ `
  ${blastLookup}
  uniform sampler2D uBlastPose;
  bool ejectBlock(vec2 anchor, float pivotY, float columnWidth, bool tree, inout vec3 world) {
    if (uHasBlast == 0.0) return true;
    ivec2 cell;
    if (columnWidth > 0.0) {
      cell = terrainTexel(anchor);
    } else {
      // The rows after the square terrain grid hold one pose per bridge fragment.
      int width = textureSize(uBlastMap, 0).x;
      cell = ivec2(gl_InstanceID % width, width + gl_InstanceID / width);
    }
    vec4 block = texelFetch(uBlastMap, cell, 0);
    if (block.w == 0.0) return true;
    if (block.w == -1.0) {
      float growth = groundFraction(block);
      world.y *= growth;
      return growth > 0.0;
    }
    vec4 pose = texelFetch(uBlastPose, cell, 0);
    vec3 local = world - vec3(anchor.x, pivotY, anchor.y);
    if (columnWidth > 0.0) {
      if (tree) local.y += columnWidth * 0.5 - pivotY;
      else local.y *= columnWidth / (2.0 * pivotY);
    } else {
      local.y *= block.y;
    }
    if (block.w < -1.0) {
      vec4 floorData = columnData(pose.xz);
      if (any(notEqual(floorData, vec4(0.0)))) {
        pose.y += groundFraction(blastRecord(pose.xz)) * (BASE_HEIGHT + RELIEF * unpackRelief(floorData.rg));
      }
    }
    vec3 axis = vec3(block.x, 0.0, block.z);
    float c = cos(pose.w), s = sin(pose.w);
    local *= smoothstep(0.0, 0.55, abs(block.w) - 10.0 - uBlastTime);
    vBlockLight = uLight * c - cross(axis, uLight) * s + axis * dot(axis, uLight) * (1.0 - c);
    world = pose.xyz + local * c + cross(axis, local) * s + axis * dot(axis, local) * (1.0 - c);
    return true;
  }
`
  : '';

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

  ${bridgeApproach}

  // Easter-egg chaos: every column pulses on a phase of its own, hashed from its cell.
  float chaosRelief(vec2 cell, float relief) {
    if (uBoost == 0.0) return relief;
    float phase = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
    return relief * (1.0 + uBoost * naturalGround(cell) * (0.6 + 0.5 * sin(uTime * 7.0 + phase * 6.2831)));
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
      // Remap [-1, 1] to RGB (in display space).
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

  ${blockLight}
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

  ${bridgeApproach}

  ${bridgeWave}

  ${blastLookup}

  float channelDistance(vec2 p) {
    float dz = p.y - ${BRIDGE.z};
    return abs(p.x - ${BRIDGE.x} - ${RAVINE.slope} * dz - ${RAVINE.bend} * abs(dz));
  }

  // The terrain's relief at any point on the ground, not only at column centres:
  // shadow rays and crevice samples land between columns.
  float reliefAt(vec2 p) {
    if (channelDistance(p) < ${RAVINE.halfWidth}) return 0.0;
    float blend = naturalGround(p);
    float bank = ${BRIDGE.bankRelief} + bridgeLift(p.x);
    if (blend == 0.0) return bank;
    float fromCenter = length(p);
    // The island tapers to a low shelf at its rim.
    float rim = 1.0 - smoothstep(0.5, 1.0, fromCenter / uRadius);

    vec2 drift = vec2(uTime * 0.07, -uTime * 0.045);
    float ridges = pow(clamp(0.5 + fbm(p * 0.3 + drift) * 1.7, 0.0, 1.0), 1.6);
    float ripple = 0.5 + 0.5 * sin(fromCenter * ${TERRAIN_WAVE.frequency} - uTime * ${TERRAIN_WAVE.speed});

    float natural = rim * (ridges * 0.9 + ripple * 0.07) + pointerLift(p) * 0.42;
    return mix(bank, natural, blend);
  }

  float occludingRelief(vec2 p) {
    ${
      DO_EXPLOSION
        ? `if (uHasBlast > 0.0) {
      float growth = groundFraction(blastRecord(p));
      if (growth < 1.0) return growth > 0.0 ? growth * reliefAt(p) : 0.0;
    }`
        : ''
    }
    return reliefAt(p);
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
      float ground = BASE_HEIGHT + occludingRelief(cell + uSun.xy * reach) * stretch;
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
      occludingRelief(cell + reach.xy) + occludingRelief(cell - reach.xy) +
      occludingRelief(cell + reach.yx) + occludingRelief(cell - reach.yx)
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
  uniform vec4 uPulse;
  ${terrainShock}

  void main() {
    // Texel (column, row) holds the grid cell of the same index; this is its centre.
    vec2 cell = (floor(gl_FragCoord.xy) + 0.5) / uColumnsAcross * (2.0 * uRadius) - uRadius;
    // No geometry ever samples the removed cells or the corners outside the island.
    if (dot(cell, cell) > uRadius * uRadius || channelDistance(cell) < ${RAVINE.halfWidth}) {
      gl_FragColor = vec4(0.0);
      return;
    }
    float relief = reliefAt(cell);
    // The chaos mode stretches every column by its own amount; shadows use the average.
    float stretch = RELIEF * (1.0 + uBoost * 0.6);

    gl_FragColor = vec4(
      packRelief(relief + shockLift(cell)),
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
  flat varying vec3 vBlockLight;
  uniform vec3 uLight;
  ${blastTransform}
  ${swell}
  ${pulseRing}

  varying vec3 vLocal;
  varying float vViewDepth;
  flat varying float vRelief;
  flat varying float vAccent;
  flat varying float vColumnHeight;
  flat varying float vRing;
  flat varying float vSunlit;
  flat varying float vOpen;

  void main() {
    vBlockLight = vec3(0.0);
    vec4 column = columnData(aCell);
    float lift = pointerLift(aCell);
    float relief = chaosRelief(aCell, unpackRelief(column.rg));
    float height = BASE_HEIGHT + relief * RELIEF;

    vec3 world = vec3(aCell.x + position.x * uCell, (position.y + 0.5) * height, aCell.y + position.z * uCell);
    ${
      DO_EXPLOSION
        ? `if (!ejectBlock(aCell, height * 0.5, uCell, false, world)) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }`
        : ''
    }
    vec4 viewPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    vLocal = position;
    vViewDepth = -viewPosition.z;
    vRelief = clamp(relief, 0.0, 1.0);
    vRing = pulseRing(aCell);
    vAccent = clamp(
      max(smoothstep(0.46, 0.74, relief), lift * 0.9) + uBoost * 0.6 + vRing,
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
  flat varying vec3 vBlockLight;
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
  flat varying float vRing;
  flat varying float vSunlit;
  flat varying float vOpen;

  // Light left at the bottom of a fully enclosed crevice.
  const float CREVICE = 0.58;

  vec3 shadeLit(vec3 normal) {
    float isTop = step(0.5, normal.y);
    float along = clamp(vLocal.y + 0.5, 0.0, 1.0);
    float light =
      blockLight(normal, uLight, along) * mix(SHADE, 1.0, vSunlit) * mix(CREVICE, 1.0, vOpen);

    vec3 albedo = mix(uLow, uHigh, smoothstep(0.02, 0.75, vRelief));
    // Tops whose height lands near a multiple of the step get inked.
    float contour = smoothstep(0.38, 0.5, abs(fract(vColumnHeight * uContourFrequency) - 0.5));
    albedo = mix(albedo, uLine, contour * isTop * 0.2);
    albedo = mix(albedo, uAccent, vAccent);
    if (dot(vBlockLight, vBlockLight) > 0.5) {
      return albedo * (0.48 + 0.52 * max(dot(normal, vBlockLight), 0.0));
    }
    return albedo * light;
  }

  void main() {
    float mode = viewMode();
    vec3 normal = faceNormal();
    vec3 lit = mode < 0.5 ? shadeLit(normal) : vec3(0.0);
    vec4 ink = vec4(mix(uLine, uAccent, vAccent), mix(0.5, 0.95, vAccent));

    vec3 color = viewColor(mode, normal, lit, ink);
    gl_FragColor = vec4(mode >= 1.5 ? mix(color, uAccent, vRing) : color, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Props: bridge, trees and clouds, one instanced draw call of the same unit box as the
 * terrain. A tree stands on its cell's column and grows or shrinks with how suitable
 * that cell is right now; a cloud block rides its cloud. Fixed bridge boxes sit directly in world space. All share the same
 * view modes as the terrain, so every render view shows them.
 */
export const propVertexShader = /* glsl */ `
  uniform float uCell;
  // xy: world anchor or cloud-local offset. z: cloud index, -1 for trees, -1-depth for bridge boxes.
  attribute vec3 aAnchor;
  // x: width, y: height, z: lift above the anchor, w: tint.
  attribute vec4 aBox;

  ${columnLookup}
  flat varying vec3 vBlockLight;
  uniform vec3 uLight;
  ${blastTransform}
  ${bridgeWave}
  ${pulseRing}
  ${terrainShock}
  ${clouds}

  varying vec3 vLocal;
  varying float vViewDepth;
  flat varying float vTint;
  flat varying float vPlankPulse;
  flat varying float vSunlit;

  void main() {
    vBlockLight = vec3(0.0);
    vec3 foot;
    float grow;
    float sunlit = 1.0;

    vPlankPulse = 0.0;
    float depth = aBox.x;
    if (aAnchor.z < -1.0) {
      foot = vec3(aAnchor.x, RELIEF * bridgeLift(aAnchor.x + position.x * aBox.x), aAnchor.y);
      grow = 1.0;
      depth = -1.0 - aAnchor.z;
      if (aBox.w == 1.0) vPlankPulse = pulseRing(aAnchor.xy);
    } else if (aAnchor.z < 0.0) {
      vec4 column = columnData(aAnchor.xy);
      float relief = unpackRelief(column.rg);
      // Trees keep to the middle slopes, out of the pits and off the peaks and shore.
      // A passing wave carries the canopy without changing its growing conditions.
      float soil = relief - shockLift(aAnchor.xy);
      grow =
        smoothstep(0.07, 0.15, soil) *
        (1.0 - smoothstep(0.34, 0.45, soil)) *
        smoothstep(0.3, 0.75, column.a);
      foot = vec3(aAnchor.x, BASE_HEIGHT + chaosRelief(aAnchor.xy, relief) * RELIEF, aAnchor.y);
      sunlit = column.b;
    } else {
      vec4 cloud = uClouds[int(aAnchor.z)];
      grow = cloud.w;
      foot = cloud.xyz + vec3(aAnchor.x, 0.0, aAnchor.y) * grow;
    }

    vec3 size = vec3(aBox.x, aBox.y, depth) * grow;
    vec3 world = foot + vec3(position.x * size.x, aBox.z * grow + (position.y + 0.5) * size.y, position.z * size.z);
    ${
      DO_EXPLOSION
        ? `float pivotY = aAnchor.z < -1.0 ? foot.y + aBox.z + size.y * 0.5 : foot.y * 0.5;
    if (aAnchor.z < 0.0 && !ejectBlock(aAnchor.xy, pivotY, aAnchor.z == -1.0 ? uCell : 0.0, true, world)) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }`
        : ''
    }
    vec4 viewPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    vLocal = position;
    vViewDepth = -viewPosition.z;
    vTint = aBox.w;
    vSunlit = sunlit;
  }
`;

export const propFragmentShader = /* glsl */ `
  flat varying vec3 vBlockLight;
  uniform vec3 uHigh;
  uniform vec3 uAccent;
  ${viewModes}
  ${lighting}

  flat varying float vTint;
  flat varying float vPlankPulse;
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

    if (dot(vBlockLight, vBlockLight) > 0.5) light = 0.48 + 0.52 * max(dot(normal, vBlockLight), 0.0);
    // Clouds are the page's lightest colour, which would vanish as wireframe on a
    // light page, so their outlines are drawn in the same ink as the terrain's.
    vec3 ink = vTint > 2.5 ? uLine : tint;

    gl_FragColor = vec4(mix(viewColor(mode, normal, tint * light, vec4(ink, 0.8)), uAccent, vPlankPulse), 1.0);
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

  ${floorGrid}

  void main() {
    float fromCenter = length(vGround);
    float lines = floorGrid(vGround, uSpacing, 4.0);
    float rim = 1.0 - smoothstep(uRadius * 0.42, uRadius, fromCenter);

    float ring = pulseRing(vGround);

    float pool = (1.0 - smoothstep(uIsland * 0.7, uIsland * 1.45, fromCenter)) * uPool;

    float lineAlpha = lines * rim * rim * (uOpacity + ring * 0.26);
    float alpha = lineAlpha + pool * (1.0 - lineAlpha);
    vec3 color = mix(uLine, uAccent, ring * lines);

    // Under the island the ground is solid, in the terrain's own shaded colour. The
    // columns stand slightly apart, and when the camera lines up with the grid the
    // gaps between them form a slit straight through the island; this closes it.
    float underIsland = 1.0 - smoothstep(uIsland - 0.2, uIsland - 0.05, fromCenter);
    color = mix(color, mix(uLow * 0.55, uAccent, ring * 0.65), underIsland);
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
