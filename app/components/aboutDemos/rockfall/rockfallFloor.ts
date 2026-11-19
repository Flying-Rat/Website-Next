import {
  BufferGeometry,
  CircleGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Mesh,
  ShaderMaterial,
} from 'three';

import { type RockfallTones, luminance } from './rockfallModels';
import { RAT } from './rockfallWorld';

/** How far the grid runs from the middle of the map, in blocks. */
const REACH = 12 * RAT;
/** The map's own shadow reaches a little past its widest ground. */
const MAP_SHADOW = 6.6 * RAT;

const VERTEX = /* glsl */ `
  varying vec2 vPlane;

  void main() {
    vPlane = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Full strength out to `uSolid` of the way and gone by `uReach`, so nothing on
// the floor ends in a hard edge.
const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uReach;
  uniform float uSolid;
  varying vec2 vPlane;

  void main() {
    float away = length(vPlane) / uReach;
    gl_FragColor = vec4(uColor, uOpacity * (1.0 - smoothstep(uSolid, 1.0, away)));
    #include <colorspace_fragment>
  }
`;

function fading(reach: number, solid: number) {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new Color() },
      uOpacity: { value: 0 },
      uReach: { value: reach },
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
  private readonly gridGeometry = new BufferGeometry();
  private readonly gridMaterial = fading(REACH, 0.3);
  private readonly discGeometry = new CircleGeometry(1, 40).rotateX(-Math.PI / 2);
  private readonly mapShadow = fading(1, 0.4);
  private readonly ratShadow = fading(1, 0.25);

  constructor() {
    // Lines fall on the half block, where the blocks' own edges are.
    const lines: number[] = [];
    const end = REACH - 0.5;
    for (let at = -end; at <= end; at++) {
      lines.push(at, 0, -end, at, 0, end, -end, 0, at, end, 0, at);
    }
    this.gridGeometry.setAttribute('position', new Float32BufferAttribute(lines, 3));
    const grid = new LineSegments(this.gridGeometry, this.gridMaterial);
    // Just under the blocks, so a line never fights the foot of a block for depth.
    grid.position.y = -0.02;
    const shadow = new Mesh(this.discGeometry, this.mapShadow);
    shadow.position.y = -0.04;
    shadow.scale.setScalar(MAP_SHADOW);
    this.group.add(shadow, grid);
  }

  /** A shadow to lay under one rat: a disc of radius 1, to be sized by whoever places it. */
  blob() {
    return new Mesh(this.discGeometry, this.ratShadow);
  }

  setTones(tones: RockfallTones) {
    const ink = new Color(tones.ink);
    const paper = new Color(tones.paper);
    // A shadow is the darker of the page's two tones: it cannot be lighter than the page.
    if (luminance(ink) < luminance(paper)) {
      shade(this.gridMaterial, ink, 0.14);
      shade(this.mapShadow, ink, 0.14);
      shade(this.ratShadow, ink, 0.3);
    } else {
      shade(this.gridMaterial, ink, 0.17);
      shade(this.mapShadow, paper, 0.5);
      shade(this.ratShadow, paper, 0.6);
    }
  }

  dispose() {
    this.gridGeometry.dispose();
    this.discGeometry.dispose();
    for (const material of [this.gridMaterial, this.mapShadow, this.ratShadow]) {
      material.dispose();
    }
  }
}
