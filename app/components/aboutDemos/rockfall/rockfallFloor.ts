import { CircleGeometry, Color, Group, Mesh, ShaderMaterial } from 'three';

import { type DemoLook, floorGrid, floorInk } from '../demoLook';
import { RAT, SIZE } from './rockfallWorld';

/** How far the grid runs from the middle of the map, in blocks. */
const REACH = 12 * RAT;
/** The map's own shadow reaches a little past its widest ground. */
const MAP_SHADOW = 6.6 * RAT;

const VERTEX = /* glsl */ `
  varying vec2 vPlane;
  varying vec2 vGround;

  void main() {
    vPlane = position.xz;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vGround = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Full strength out to `uSolid` of the way to the disc's edge and gone by the
// edge itself, so nothing on the floor ends in a hard line.
const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSolid;
  varying vec2 vPlane;
  varying vec2 vGround;

  #ifdef RULED
    ${floorGrid}
  #endif

  void main() {
    float fade = 1.0 - smoothstep(uSolid, 1.0, length(vPlane));
    float alpha = uOpacity * fade;
    #ifdef RULED
      // A fine rule on every block's edge and a full one round each cell of the
      // plan, which the map's own corner starts.
      alpha *= fade * floorGrid(vGround + ${(SIZE / 2).toFixed(1)}, 1.0, ${RAT.toFixed(1)});
    #endif
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

function fading(solid: number, ruled = false) {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    defines: ruled ? { RULED: '' } : {},
    uniforms: {
      uColor: { value: new Color() },
      uOpacity: { value: 0 },
      uSolid: { value: solid },
    },
  });
}

function shade(material: ShaderMaterial, color: Color, opacity: number) {
  material.uniforms.uColor.value.copy(color);
  material.uniforms.uOpacity.value = opacity;
}

export class RockfallFloor {
  readonly group = new Group();
  private readonly discGeometry = new CircleGeometry(1, 40).rotateX(-Math.PI / 2);
  private readonly gridMaterial = fading(0.3, true);
  private readonly mapShadow = fading(0.4);
  private readonly ratShadow = fading(0.25);

  constructor() {
    const grid = new Mesh(this.discGeometry, this.gridMaterial);
    // Just under the blocks, so a line never fights the foot of a block for depth.
    grid.position.y = -0.02;
    grid.scale.setScalar(REACH);
    const shadow = new Mesh(this.discGeometry, this.mapShadow);
    shadow.position.y = -0.04;
    shadow.scale.setScalar(MAP_SHADOW);
    this.group.add(shadow, grid);
  }

  /** A shadow to lay under one rat: a disc of radius 1, to be sized by whoever places it. */
  blob() {
    return new Mesh(this.discGeometry, this.ratShadow);
  }

  setLook(look: DemoLook) {
    shade(this.gridMaterial, look.line, floorInk(look));
    // A shadow is the darker of the page's two tones: it cannot be lighter than the page.
    if (look.isLight) {
      shade(this.mapShadow, look.line, 0.14);
      shade(this.ratShadow, look.line, 0.3);
    } else {
      shade(this.mapShadow, look.fog, 0.5);
      shade(this.ratShadow, look.fog, 0.6);
    }
  }

  dispose() {
    this.discGeometry.dispose();
    for (const material of [this.gridMaterial, this.mapShadow, this.ratShadow]) {
      material.dispose();
    }
  }
}
