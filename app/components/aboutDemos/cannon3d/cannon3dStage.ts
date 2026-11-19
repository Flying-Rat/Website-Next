import {
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Quaternion,
  RingGeometry,
  ShaderMaterial,
  type Vector3,
} from 'three';

import { type DemoLook, floorGrid, floorInk } from '../demoLook';

/** How far the floor runs from the cannon, in cells. */
const CELLS = 13;

const FADE_VERTEX = /* glsl */ `
  varying vec2 vPlane;

  void main() {
    vPlane = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Opaque in the middle and gone by `uReach`, so nothing ends in a hard edge.
const FADE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uReach;
  varying vec2 vPlane;

  #ifdef RULED
    ${floorGrid}
  #endif

  void main() {
    // Narrower across than along: the lines running toward the viewer carry the
    // depth, while the ones spreading sideways would only cross the copy.
    float away = length(vPlane * vec2(1.7, 1.0)) / uReach;
    float alpha = uOpacity * (1.0 - smoothstep(0.08, 1.0, away));
    #ifdef RULED
      // A full rule round each cell, and a fine one halving it each way.
      alpha *= floorGrid(vPlane, 0.5, 2.0);
    #endif
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

function fading(reach: number, ruled = false) {
  return new ShaderMaterial({
    vertexShader: FADE_VERTEX,
    fragmentShader: FADE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    defines: ruled ? { RULED: '' } : {},
    uniforms: {
      uColor: { value: new Color() },
      uOpacity: { value: 0 },
      uReach: { value: reach },
    },
  });
}

/** The grid dissolves with distance; the lines converging place the cannon in depth. */
export class CannonGround {
  readonly group = new Group();
  private readonly gridGeometry = new PlaneGeometry(2 * CELLS, 2 * CELLS).rotateX(-Math.PI / 2);
  private readonly gridMaterial = fading(CELLS, true);
  private readonly shadowGeometry = new CircleGeometry(1, 48).rotateX(-Math.PI / 2);
  private readonly shadowMaterial = fading(1.7);
  private readonly shadow: Mesh;

  constructor() {
    const grid = new Mesh(this.gridGeometry, this.gridMaterial);
    grid.renderOrder = -1;
    this.shadow = new Mesh(this.shadowGeometry, this.shadowMaterial);
    this.shadow.renderOrder = -2;
    this.shadow.position.y = 0.01;
    this.group.add(this.shadow, grid);
  }

  /** `cell` is the grid's spacing; `footprint` the shadow's radius, in cells. */
  place(position: Vector3, cell: number, footprint: number) {
    this.group.position.copy(position);
    this.group.scale.setScalar(cell);
    this.shadow.scale.setScalar(footprint);
  }

  setLook(look: DemoLook) {
    this.gridMaterial.uniforms.uColor.value.copy(look.line);
    this.gridMaterial.uniforms.uOpacity.value = floorInk(look);
    // A shadow is the darker of the page's two tones: it cannot be lighter than the page.
    this.shadowMaterial.uniforms.uColor.value.copy(look.isLight ? look.line : look.fog);
    this.shadowMaterial.uniforms.uOpacity.value = look.isLight ? 0.22 : 0.5;
  }

  dispose() {
    this.gridGeometry.dispose();
    this.gridMaterial.dispose();
    this.shadowGeometry.dispose();
    this.shadowMaterial.dispose();
  }
}

type Ring = {
  mesh: Mesh<RingGeometry, MeshBasicMaterial>;
  age: number;
  seconds: number;
  from: number;
  to: number;
  strength: number;
};

/** Thin rings that open and fade: the flash at the mouth and the shockwave on the page. */
export class Rings {
  readonly group = new Group();
  private readonly geometry = new RingGeometry(0.9, 1, 64);
  private readonly rings: Ring[] = [];

  constructor(count: number) {
    for (let i = 0; i < count; i++) {
      const material = new MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: DoubleSide,
      });
      const mesh = new Mesh(this.geometry, material);
      mesh.visible = false;
      mesh.renderOrder = 1;
      this.group.add(mesh);
      this.rings.push({ mesh, age: 0, seconds: 0, from: 0, to: 0, strength: 0 });
    }
  }

  get busy() {
    return this.rings.some((ring) => ring.mesh.visible);
  }

  /** Opens a ring from radius `from` to `to`. Without `facing` it lies flat on the page. */
  open(
    at: Vector3,
    facing: Quaternion | null,
    color: Color,
    from: number,
    to: number,
    seconds: number,
    strength: number,
  ) {
    const ring = this.rings.find((candidate) => !candidate.mesh.visible) ?? this.rings[0];
    Object.assign(ring, { age: 0, seconds, from, to, strength });
    ring.mesh.position.copy(at);
    if (facing) {
      ring.mesh.quaternion.copy(facing);
    } else {
      ring.mesh.quaternion.identity();
    }
    ring.mesh.material.color.copy(color);
    ring.mesh.visible = true;
    this.pose(ring);
  }

  step(dt: number) {
    for (const ring of this.rings) {
      if (!ring.mesh.visible) {
        continue;
      }
      ring.age += dt;
      if (ring.age >= ring.seconds) {
        ring.mesh.visible = false;
      } else {
        this.pose(ring);
      }
    }
  }

  clear() {
    for (const ring of this.rings) {
      ring.mesh.visible = false;
    }
  }

  private pose(ring: Ring) {
    const t = ring.age / ring.seconds;
    // Fast at first, then slowing as it thins out.
    const open = 1 - (1 - t) ** 3;
    ring.mesh.scale.setScalar(ring.from + (ring.to - ring.from) * open);
    ring.mesh.material.opacity = ring.strength * (1 - t) ** 2;
  }

  dispose() {
    this.geometry.dispose();
    for (const ring of this.rings) {
      ring.mesh.material.dispose();
    }
  }
}
