import {
  type BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

export type CannonTones = { ink: string; paper: string; accent: string };

/** Where the wheels meet the ground, in the model's own units below its pivot. */
export const GROUND = 106;
/** Distance from the pivot to the mouth of the barrel. */
export const MUZZLE = 250;
/** Half the model's width across both wheels. */
export const HALF_WIDTH = 134;
/** From the ground to the mouth of a barrel raised to fire. */
export const HEIGHT = 246;
/** The rat's radius where it is widest. */
export const RAT_RADIUS = 44;

const HALF_TURN = Math.PI / 2;

// Two flat tones split by a fixed light, a narrow glint where the surface mirrors
// that light, and a rim where it turns away from the eye. Flat tones keep the
// page's ink and coral exactly; the rim is what keeps one part readable in front
// of another of the same tone.
const VERTEX = /* glsl */ `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uLit;
  uniform vec3 uShade;
  uniform vec3 uGlint;
  uniform vec3 uLight;
  uniform vec3 uHalf;
  uniform float uEdge;
  varying vec3 vNormal;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 color = mix(uShade, uLit, smoothstep(0.0, 0.16, dot(normal, uLight)));
    color = mix(color, uGlint, smoothstep(0.9, 0.95, dot(normal, uHalf)));
    float away = 1.0 - clamp(normal.z, 0.0, 1.0);
    color = mix(color, uShade, uEdge * away * away * away);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

// Both in view space: the light stays put while the cannon turns under it.
const LIGHT = new Vector3(-0.5, 0.72, 0.48).normalize();
const HALFWAY = new Vector3(0, 0, 1).add(LIGHT).normalize();
const WHITE = new Color(1, 1, 1);
const BLACK = new Color(0, 0, 0);

function tone() {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uLit: { value: new Color() },
      uShade: { value: new Color() },
      uGlint: { value: new Color() },
      uLight: { value: LIGHT },
      uHalf: { value: HALFWAY },
      uEdge: { value: 0 },
    },
  });
}

/** Cylinders and cones are built upright; these lay one along the barrel or the axle. */
const along = (geometry: BufferGeometry) => geometry.rotateX(HALF_TURN);
const across = (geometry: BufferGeometry) => geometry.rotateZ(HALF_TURN);

/** A single colour, with no light on it. */
function flat(material: ShaderMaterial, color: Color) {
  material.uniforms.uLit.value.copy(color);
  material.uniforms.uShade.value.copy(color);
  material.uniforms.uGlint.value.copy(color);
  material.uniforms.uEdge.value = 0;
}

/** `edge` is how far the rim falls to the shade tone. */
function shaded(material: ShaderMaterial, lit: Color, shade: Color, edge: number) {
  material.uniforms.uLit.value.copy(lit);
  material.uniforms.uShade.value.copy(shade);
  material.uniforms.uGlint.value.copy(lit).lerp(WHITE, 0.4);
  material.uniforms.uEdge.value = edge;
}

function luminance(color: Color) {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

/**
 * The cannon and its rat. Everything points along +Z, toward the viewer: `root`
 * turns left and right, `barrel` tips up and down, `tube` slides back on recoil.
 */
export class CannonModel {
  readonly root = new Group();
  readonly barrel = new Group();
  readonly tube = new Group();
  /** The rat waiting in the mouth of the barrel. */
  readonly passenger: Group;

  private readonly metal = tone();
  private readonly coral = tone();
  private readonly hollow = tone();
  private readonly blank = tone();
  private readonly geometries = new Set<BufferGeometry>();

  constructor() {
    const { metal, coral, hollow, blank } = this;
    const { tube, barrel, root } = this;

    this.add(tube, along(new CylinderGeometry(58, 82, 330, 40)), metal, 0, 0, 55);
    this.add(tube, along(new CylinderGeometry(70, 70, 14, 40)), metal, 0, 0, 120);
    this.add(tube, along(new CylinderGeometry(80, 80, 14, 40)), metal, 0, 0, -10);
    this.add(tube, along(new CylinderGeometry(74, 62, 46, 40)), metal, 0, 0, 222);
    this.add(tube, new TorusGeometry(62, 13, 16, 48), metal, 0, 0, MUZZLE - 6);
    this.add(tube, new CircleGeometry(52, 40), hollow, 0, 0, MUZZLE - 4);
    this.add(tube, new SphereGeometry(82, 32, 20), metal, 0, 0, -110);
    this.add(tube, new SphereGeometry(22, 16, 12), metal, 0, 0, -200);
    this.passenger = this.rat();
    this.passenger.position.z = MUZZLE - 82;
    tube.add(this.passenger);
    barrel.add(tube);
    this.add(barrel, across(new CylinderGeometry(20, 20, 196, 20)), metal, 0, 0, 0);
    root.add(barrel);

    const tyre = new TorusGeometry(80, 16, 18, 56).rotateY(HALF_TURN);
    const disc = across(new CylinderGeometry(68, 68, 12, 48));
    const hub = across(new CylinderGeometry(24, 24, 32, 24));
    for (const x of [-118, 118]) {
      this.add(root, tyre, metal, x, -10, 0);
      this.add(root, disc, blank, x, -10, 0);
      this.add(root, hub, coral, x, -10, 0);
    }
    this.add(root, across(new CylinderGeometry(12, 12, 236, 12)), metal, 0, -10, 0);
  }

  /** Another rat for the air. It shares the passenger's geometry and materials. */
  spawnRat() {
    const rat = this.passenger.clone();
    rat.position.set(0, 0, 0);
    rat.scale.setScalar(1);
    rat.visible = false;
    return rat;
  }

  private add(
    parent: Group,
    geometry: BufferGeometry,
    material: ShaderMaterial,
    x: number,
    y: number,
    z: number,
  ) {
    this.geometries.add(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  /** Nose along +Z, about 175 units from nose to the root of the tail. */
  private rat() {
    const { metal, coral, blank } = this;
    const rat = new Group();
    // Modelled at its own size, then grown to fill the mouth of the barrel.
    const body = new Group();
    body.scale.setScalar(RAT_RADIUS / 34);
    rat.add(body);
    this.add(body, new SphereGeometry(34, 24, 16), metal, 0, 0, 0).scale.set(1, 0.9, 1.5);
    this.add(body, new SphereGeometry(26, 24, 16), metal, 0, 3, 46);
    this.add(body, along(new ConeGeometry(17, 40, 20)), metal, 0, 0, 78);
    this.add(body, new SphereGeometry(6.5, 12, 10), coral, 0, 0, 99);
    const helmet = new SphereGeometry(29, 24, 12, 0, Math.PI * 2, 0, HALF_TURN);
    this.add(body, helmet, coral, 0, 4, 44).rotation.x = -0.3;
    for (const side of [-1, 1]) {
      this.add(body, new SphereGeometry(11, 14, 10), metal, side * 23, 22, 36).scale.z = 0.45;
      this.add(body, new SphereGeometry(4.6, 10, 8), blank, side * 11.5, 5, 69);
    }
    const tail = along(new CylinderGeometry(2.5, 5, 84, 8));
    this.add(body, tail, metal, 0, 8, -84).rotation.x = 0.22;
    return rat;
  }

  setTones(tones: CannonTones) {
    const ink = new Color(tones.ink);
    const paper = new Color(tones.paper);
    const accent = new Color(tones.accent);
    const mix = (toPaper: number) => ink.clone().lerp(paper, toPaper);
    // On a light page the ink is the darker tone and lifts toward the page where
    // the light falls. On a dark page it is the lighter one, and a cannon in
    // near-white would lose its shape: the shade there is much deeper and the
    // rims fall to it, so each part is outlined against the next.
    const lightPage = luminance(ink) < luminance(paper);
    if (lightPage) {
      shaded(this.metal, mix(0.2), ink, 0);
    } else {
      shaded(this.metal, ink, mix(0.55), 0.8);
    }
    shaded(this.coral, accent, accent.clone().lerp(BLACK, 0.25), 0);
    flat(this.hollow, lightPage ? ink : paper);
    flat(this.blank, paper);
  }

  dispose() {
    for (const geometry of this.geometries) {
      geometry.dispose();
    }
    for (const material of [this.metal, this.coral, this.hollow, this.blank]) {
      material.dispose();
    }
  }
}
