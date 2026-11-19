import {
  BoxGeometry,
  Color,
  Data3DTexture,
  Group,
  Mesh,
  NearestFilter,
  RedFormat,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
} from 'three';

import { type DemoLook, blockLight, ratTones } from '../demoLook';
import { HEIGHT, SIZE } from './rockfallWorld';

// The demos' shared light on every box. Rats use the same boxes as the ground.
const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vHeight;
  varying float vLow;
  varying vec3 vMiddle;
  #ifdef OCCLUDE
    attribute vec4 aCell;
    uniform sampler3D uSolid;
    uniform vec2 uGrid;
    varying vec3 vLocal;
    varying vec3 vFace;
    // The neighbours round the cell a face looks into: its four sides, its four
    // corners, and how near a roof is over it. The same at every corner of a
    // face, so they are read once a corner here, not once a pixel.
    varying vec4 vSides;
    varying vec4 vCorners;
    varying float vRoof;
    varying float vGrain;

    // Below the map is the floor, which counts as solid; beside it is open air.
    float filled(vec3 cell) {
      if (cell.y < 0.0) return 1.0;
      if (min(cell.x, cell.z) < 0.0 || max(cell.x, cell.z) >= uGrid.x || cell.y >= uGrid.y) return 0.0;
      return step(0.002, texture(uSolid, (cell.xzy + 0.5) / uGrid.xxy).r);
    }
  #endif

  void main() {
    #ifdef OCCLUDE
      vLocal = position;
      vFace = normal;
      vec3 n = floor(normal + 0.5);
      vec3 u = abs(n.x) > 0.5 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 v = abs(n.z) > 0.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
      vec3 c = aCell.xyz + n;
      // A block that has left its cell takes no shade from it.
      vSides = vec4(filled(c + u), filled(c - u), filled(c + v), filled(c - v)) * aCell.w;
      vCorners =
        vec4(filled(c + u + v), filled(c + u - v), filled(c - u + v), filled(c - u - v)) * aCell.w;
      float roof = 0.0;
      for (int k = 1; k <= 8; k++) {
        roof = max(roof, filled(c + vec3(0.0, float(k), 0.0)) * (1.0 - float(k - 1) / 9.0));
      }
      vRoof = roof * aCell.w;
      vGrain = (fract(sin(dot(aCell.xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453) - 0.5) * aCell.w;
    #endif
    mat4 placed = modelMatrix;
    #ifdef USE_INSTANCING
      placed = modelMatrix * instanceMatrix;
    #endif
    vec4 world = placed * vec4(position, 1.0);
    vUv = uv;
    vNormal = normalize(mat3(placed) * normal);
    vHeight = world.y;
    vMiddle = placed[3].xyz;
    // 0 along the top of a side face, 1 along its foot; 0 all over a top face.
    vLow = (1.0 - abs(normal.y)) * (0.5 - position.y);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uHigh;
  uniform vec3 uLow;
  uniform vec3 uLight;
  uniform float uSeam;
  uniform float uDepth;
  uniform float uTall;
  uniform vec4 uAim;
  uniform vec3 uAimColor;
  uniform float uAimShown;
  uniform vec4 uBurn;
  uniform float uBurnShown;
  varying vec3 vMiddle;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vHeight;
  varying float vLow;

  #ifdef OCCLUDE
    uniform vec2 uOcclusion;
    varying vec3 vLocal;
    varying vec3 vFace;
    varying vec4 vSides;
    varying vec4 vCorners;
    varying float vRoof;
    varying float vGrain;

    // Nothing over the middle of a face, rising to full along the edge it shares.
    float toward(float t) {
      float s = clamp(t * 2.0 - 1.0, 0.0, 1.0);
      return s * s;
    }

    // The blocks round the cell a face looks into darken the face toward them,
    // and anything a few levels over that cell shades it like a roof.
    vec2 occlusion() {
      vec3 n = floor(vFace + 0.5);
      vec3 u = abs(n.x) > 0.5 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 v = abs(n.z) > 0.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
      vec2 f = vec2(dot(vLocal, u), dot(vLocal, v)) + 0.5;
      vec4 s = vSides;
      vec4 w = vec4(toward(f.x), toward(1.0 - f.x), toward(f.y), toward(1.0 - f.y));
      float crease = dot(s, w);
      crease += vCorners.x * (1.0 - s.x) * (1.0 - s.z) * w.x * w.z;
      crease += vCorners.y * (1.0 - s.x) * (1.0 - s.w) * w.x * w.w;
      crease += vCorners.z * (1.0 - s.y) * (1.0 - s.z) * w.y * w.z;
      crease += vCorners.w * (1.0 - s.y) * (1.0 - s.w) * w.y * w.w;
      return vec2(min(crease, 1.0), vRoof);
    }
  #endif

  ${blockLight}

  void main() {
    // Ground only, through uDepth: stone pales with height, a block at a time,
    // and a wall darkens toward the floor it stands on.
    float level = smoothstep(0.02, 0.75, vMiddle.y / uTall);
    float foot = 0.3 + 0.7 * clamp(vHeight / uTall, 0.0, 1.0) - 0.08 * vLow;
    vec3 color = mix(uHigh, mix(uLow, uHigh, level), uDepth);
    color *= blockLight(normalize(vNormal), uLight, mix(1.0, foot, uDepth));
    #ifdef OCCLUDE
      color *= 1.0 - dot(occlusion(), uOcclusion);
      // Per-block grain, so a flat wall is not one tone.
      color *= 1.0 + 0.035 * vGrain;
    #endif
    // No line between blocks: each face only falls away softly toward its edges,
    // as if the blocks stood a little apart. Never narrower than a pixel or two,
    // so it does not shimmer on small blocks.
    vec2 inset = min(vUv, 1.0 - vUv);
    float border = min(inset.x, inset.y);
    float edge = 1.0 - smoothstep(0.0, max(0.11, 1.5 * fwidth(border)), border);
    color *= 1.0 - uSeam * edge * edge;
    // A block the aimed shot would destroy, whole: the rule goes by its middle.
    float doomed = uAimShown * step(distance(vMiddle, uAim.xyz), uAim.w);
    color = mix(color, uAimColor, doomed * (0.3 + 0.5 * edge));
    float heat = uBurnShown * (1.0 - smoothstep(uBurn.w * 0.45, uBurn.w, distance(vMiddle, uBurn.xyz)));
    color = mix(color, uAimColor, heat * (0.55 + 0.4 * edge));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

// Drawn over everything else, so the ring is never cut by a block.
const BUBBLE_VERTEX = /* glsl */ `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BUBBLE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFill;
  varying vec3 vNormal;

  void main() {
    // The view has no perspective, so every ray runs along the view's own z.
    float rim = 1.0 - abs(normalize(vNormal).z);
    float ring = smoothstep(0.72, 0.9, rim);
    float body = uFill + 0.4 * rim * rim * rim;
    gl_FragColor = vec4(uColor, uOpacity * clamp(body + ring, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

// World space, from the right and well above the floor: top brightest, then the
// face on the right, then the one on the left.
const LIGHT = new Vector3(0.78, 0.6, 0.17).normalize();
const UP = new Vector3(0, 1, 0);
/** How dark a face of the map gets in a crease, and under a roof. */
const OCCLUSION = new Vector2(0.4, 0.22);
/** How much a ground block's faces darken at their edges. */
const SEAM = 0.3;
/** A rat is modelled a little over a unit long, tail included, then brought down to fit one. */
const RAT_SCALE = 0.85;

type Aim = {
  uAim: { value: Vector4 };
  uAimColor: { value: Color };
  uAimShown: { value: number };
  uBurn: { value: Vector4 };
  uBurnShown: { value: number };
};

/** `aim` is shared by the materials that show the target; the rest get one that stays off. */
function tone(depth: number, aim: Aim = unaimed()) {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uHigh: { value: new Color() },
      uLow: { value: new Color() },
      uLight: { value: LIGHT },
      uSeam: { value: 0 },
      uDepth: { value: depth },
      // The height at which the ground is at its lightest.
      uTall: { value: HEIGHT * 0.78 },
      ...aim,
    },
  });
}

function unaimed(): Aim {
  return {
    uAim: { value: new Vector4() },
    uAimColor: { value: new Color() },
    uAimShown: { value: 0 },
    uBurn: { value: new Vector4() },
    uBurnShown: { value: 0 },
  };
}

/** `low` is what the ground is at the floor; everything else is one colour all over. */
function paint(material: ShaderMaterial, high: Color, low: Color = high) {
  material.uniforms.uHigh.value.copy(high);
  material.uniforms.uLow.value.copy(low);
}

export class RockfallModels {
  readonly block = new BoxGeometry(1, 1, 1);
  /** The map's own blocks; the game gives it a per-block `aCell` attribute. */
  readonly ground = new BoxGeometry(1, 1, 1);
  private readonly aim = unaimed();
  private readonly solid = new Data3DTexture(
    new Uint8Array(SIZE * SIZE * HEIGHT),
    SIZE,
    SIZE,
    HEIGHT,
  );
  readonly stone = tone(1, this.aim);
  readonly coral = tone(0);
  /** The stone's tones on small pieces, without the map's shading by height. */
  readonly dust = tone(0);
  private readonly fur = tone(0);
  private readonly eye = tone(0);
  /** Drawn over everything: it comes from the viewer, so a depth test would hide it. */
  readonly shot = tone(0);
  /** Shared by every material, so the light can turn with the view. */
  private readonly light = LIGHT.clone();

  constructor() {
    for (const material of this.materials()) {
      material.uniforms.uLight.value = this.light;
    }
    this.shot.depthTest = false;
    this.shot.depthWrite = false;
    this.solid.format = RedFormat;
    this.solid.minFilter = NearestFilter;
    this.solid.magFilter = NearestFilter;
    this.solid.unpackAlignment = 1;
    this.stone.defines.OCCLUDE = '';
    this.stone.uniforms.uSeam.value = SEAM;
    Object.assign(this.stone.uniforms, {
      uSolid: { value: this.solid },
      uGrid: { value: new Vector2(SIZE, HEIGHT) },
      uOcclusion: { value: OCCLUSION.clone() },
    });
  }

  /** Shades the map's blocks by what stands round them; call it whenever `solid` changes. */
  setGround(solid: Uint8Array) {
    this.solid.image.data = solid;
    this.solid.needsUpdate = true;
  }

  /**
   * Turns the light about the vertical by `angle`, so a view turned by as much
   * still sees the top brightest, then its right-hand faces, then its left.
   */
  turnLight(angle: number) {
    this.light.copy(LIGHT).applyAxisAngle(UP, angle);
  }

  /** Fades the shading by neighbours, from 0 to 1: a block shrinking away has none left. */
  showOcclusion(shown: number) {
    this.stone.uniforms.uOcclusion.value.copy(OCCLUSION).multiplyScalar(shown);
  }

  /** A rat one unit long, standing on its origin and facing +Z; whoever places it sizes it. */
  rat() {
    const { fur, coral, eye } = this;
    const rat = new Group();
    const figure = new Group();
    figure.scale.setScalar(RAT_SCALE);
    rat.add(figure);
    const add = (
      material: ShaderMaterial,
      width: number,
      height: number,
      length: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.block, material);
      mesh.scale.set(width, height, length);
      mesh.position.set(x, y, z);
      figure.add(mesh);
      return mesh;
    };
    add(fur, 0.4, 0.3, 0.52, 0, 0.15, -0.06);
    add(fur, 0.34, 0.28, 0.26, 0, 0.2, 0.31);
    add(fur, 0.18, 0.13, 0.13, 0, 0.125, 0.5);
    add(coral, 0.08, 0.07, 0.05, 0, 0.16, 0.585);
    add(coral, 0.4, 0.13, 0.32, 0, 0.385, 0.3);
    for (const side of [-1, 1]) {
      add(fur, 0.11, 0.13, 0.05, side * 0.14, 0.5, 0.2);
      add(eye, 0.06, 0.06, 0.02, side * 0.1, 0.25, 0.445);
    }
    add(coral, 0.05, 0.05, 0.36, 0, 0.12, -0.47).rotation.x = 0.45;
    return rat;
  }

  /** `fill` is how solid the sphere is inside its ring, from 0 to 1. */
  bubble(fill: number) {
    return new ShaderMaterial({
      vertexShader: BUBBLE_VERTEX,
      fragmentShader: BUBBLE_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uColor: this.aim.uAimColor,
        uOpacity: { value: 0 },
        uFill: { value: fill },
      },
    });
  }

  /** Sets the blocks within `radius` of `centre` glowing; `shown` from 0 to 1. */
  markBurn(centre: Vector3, radius: number, shown: number) {
    this.aim.uBurn.value.set(centre.x, centre.y, centre.z, radius);
    this.aim.uBurnShown.value = shown;
  }

  /** Marks the blocks a shot at `centre` would destroy; `shown` fades the mark in and out. */
  markAim(centre: Vector3 | null, radius: number, shown: number) {
    if (centre) {
      this.aim.uAim.value.set(centre.x, centre.y, centre.z, radius);
    }
    this.aim.uAimShown.value = shown;
  }

  setLook(look: DemoLook) {
    paint(this.stone, look.high, look.low);
    paint(this.dust, look.low.clone().lerp(look.high, 0.5));
    const rat = ratTones(look);
    paint(this.fur, rat.fur);
    paint(this.eye, rat.eye);
    paint(this.coral, look.accent);
    paint(this.shot, look.accent);
    this.aim.uAimColor.value.copy(look.accent);
  }

  dispose() {
    this.block.dispose();
    this.ground.dispose();
    this.solid.dispose();
    for (const material of this.materials()) {
      material.dispose();
    }
  }

  private materials() {
    return [this.stone, this.coral, this.dust, this.fur, this.eye, this.shot];
  }
}
