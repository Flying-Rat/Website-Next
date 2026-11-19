import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  RingGeometry,
  type Object3D,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export type CannonTones = {
  ink: string;
  paper: string;
  accent: string;
  accentDeep: string;
  /** The page's two raised surface tones; the model is drawn in them. */
  surfaces: [string, string];
};

/** Where the plinth meets the ground, in the model's own units below its pivot. */
export const GROUND = 106;
/** Distance from the pivot to the mouth of the barrel. */
export const MUZZLE = 250;
/** Half the model's width: the plinth's radius. */
export const HALF_WIDTH = 116;
/** From the ground to the mouth of a barrel raised to fire. */
export const HEIGHT = 214;
/** The rat's radius where it is widest. */
export const RAT_RADIUS = 44;

const HALF_TURN = Math.PI / 2;
/** The outline's width in CSS pixels; the creases are the renderer's hairline. */
const OUTLINE = 1.25;
/** Faces meeting at more than this many degrees get a crease line. */
const CREASE = 40;

// Two flat tones split by a fixed light, like the shading on a technical drawing:
// enough to tell the top of a part from its side, never a gradient.
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
  varying vec3 vNormal;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 color = mix(uShade, uLit, smoothstep(0.0, 0.12, dot(normal, uLight)));
    color = mix(color, uGlint, smoothstep(0.93, 0.96, dot(normal, uHalf)));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

// The back faces, pushed out along the normal by a fixed number of screen pixels
// whatever the distance, so the outline stays one weight from the plinth to a rat
// flying past the eye. Done in clip space: a world-space push would thin out with
// depth.
const HULL_VERTEX = /* glsl */ `
  uniform vec2 uViewport;
  uniform float uWidth;

  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec2 push = (projectionMatrix * vec4(normalMatrix * normal, 0.0)).xy;
    float reach = length(push);
    if (reach > 1e-5) {
      clip.xy += push / reach * uWidth * 2.0 / uViewport * clip.w;
    }
    gl_Position = clip;
  }
`;

const HULL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 1.0);
    #include <colorspace_fragment>
  }
`;

// Both in view space: the light stays put while the cannon turns under it.
const LIGHT = new Vector3(-0.45, 0.78, 0.44).normalize();
const HALFWAY = new Vector3(0, 0, 1).add(LIGHT).normalize();
const WHITE = new Color(1, 1, 1);

function tone() {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    // Behind the crease lines drawn exactly on its edges.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    uniforms: {
      uLit: { value: new Color() },
      uShade: { value: new Color() },
      uGlint: { value: new Color() },
      uLight: { value: LIGHT },
      uHalf: { value: HALFWAY },
    },
  });
}

/** Cylinders and cones are built upright; these lay one along the barrel or the axle. */
const along = (geometry: BufferGeometry) => geometry.rotateX(HALF_TURN);
const across = (geometry: BufferGeometry) => geometry.rotateZ(HALF_TURN);

function paint(material: ShaderMaterial, lit: Color, shade: Color, glint = 0) {
  material.uniforms.uLit.value.copy(lit);
  material.uniforms.uShade.value.copy(shade);
  material.uniforms.uGlint.value.copy(lit).lerp(WHITE, glint);
}

function luminance(color: Color) {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

/** The lighter of two colours first. */
function byLight(a: Color, b: Color): [Color, Color] {
  return luminance(a) >= luminance(b) ? [a, b] : [b, a];
}

/**
 * Surfaces in the page's tones, with an ink outline. Everything points along +Z,
 * toward the viewer: `root` turns left and right, `barrel` tips up and down,
 * `tube` slides back on recoil.
 */
export class CannonModel {
  readonly root = new Group();
  readonly barrel = new Group();
  readonly tube = new Group();
  /** The rat loaded in the barrel. */
  readonly passenger: Group;

  private readonly body = tone();
  private readonly coral = tone();
  private readonly hollow = tone();
  /** The inside of the bore, seen from within: its far wall faces away from the eye. */
  private readonly lining = Object.assign(tone(), { side: BackSide });
  private readonly pupil = tone();
  private readonly outline = new ShaderMaterial({
    vertexShader: HULL_VERTEX,
    fragmentShader: HULL_FRAGMENT,
    side: BackSide,
    // Offset as far as the fills: on a thin part, a fill pushed back alone falls
    // behind its own hull and the outline shows through it in stripes.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    uniforms: {
      uColor: { value: new Color() },
      uViewport: { value: new Vector2(1, 1) },
      uWidth: { value: OUTLINE },
    },
  });
  private readonly crease = new LineBasicMaterial();
  private readonly geometries = new Set<BufferGeometry>();
  private readonly hulls = new Map<BufferGeometry, BufferGeometry>();
  private readonly edges = new Map<BufferGeometry, BufferGeometry>();

  constructor() {
    const { body, coral, hollow, lining } = this;
    const { tube, barrel, root } = this;

    // The barrel: a plain tube with a heavier breech and collar, one coral band.
    this.part(tube, along(new CylinderGeometry(30, 30, 14, 32)), body, 0, 0, -117);
    this.part(tube, along(new CylinderGeometry(62, 62, 56, 48)), body, 0, 0, -82);
    this.part(tube, along(new CylinderGeometry(56, 56, 250, 48)), body, 0, 0, 71);
    this.part(tube, along(new CylinderGeometry(58, 58, 9, 48)), coral, 0, 0, 178);
    // The collar is a real opening, a lined bore with a floor, so the rat sits in
    // the barrel instead of being cut off by a lid on its mouth.
    const open = (radius: number, length: number) =>
      along(new CylinderGeometry(radius, radius, length, 48, 1, true));
    this.part(tube, open(64, 54), body, 0, 0, MUZZLE - 27);
    this.part(tube, new RingGeometry(48, 64, 48), body, 0, 0, MUZZLE, 'flat');
    this.part(tube, open(48, 54), lining, 0, 0, MUZZLE - 27, 'none');
    this.part(tube, new CircleGeometry(48, 48), hollow, 0, 0, MUZZLE - 53, 'none');
    this.passenger = this.rat();
    this.passenger.position.z = MUZZLE - 40;
    tube.add(this.passenger);
    barrel.add(tube);
    // Pins through the yoke, showing just past its arms.
    this.part(barrel, across(new CylinderGeometry(15, 15, 196, 24)), body, 0, 0, 0);
    root.add(barrel);

    // A turntable on a plinth, and a yoke holding the barrel by its pins.
    this.part(root, new CylinderGeometry(112, 116, 14, 64), body, 0, 7 - GROUND, 0);
    this.part(root, new CylinderGeometry(86, 86, 12, 64), body, 0, 20 - GROUND, 0);
    this.part(root, new BoxGeometry(172, 12, 60), body, 0, 32 - GROUND, 0);
    const arm = new BoxGeometry(14, GROUND - 38, 60);
    const cap = across(new CylinderGeometry(30, 30, 14, 40));
    for (const x of [-79, 79]) {
      this.part(root, arm, body, x, (38 - GROUND) / 2, 0);
      this.part(root, cap, body, x, 0, 0);
    }
  }

  /** Another rat for the air. It shares the passenger's geometry and materials. */
  spawnRat() {
    const rat = this.passenger.clone();
    rat.position.set(0, 0, 0);
    rat.scale.setScalar(1);
    rat.visible = false;
    return rat;
  }

  /** The canvas size in CSS pixels, which the outline's width is measured in. */
  setViewport(width: number, height: number) {
    this.outline.uniforms.uViewport.value.set(width, height);
  }

  /**
   * A mesh with its outline and creases. A flat piece has no volume to outline,
   * so it gets only the line around its edge; a detail gets neither.
   */
  private part(
    parent: Object3D,
    geometry: BufferGeometry,
    material: ShaderMaterial,
    x: number,
    y: number,
    z: number,
    lines: 'solid' | 'flat' | 'none' = 'solid',
  ) {
    this.geometries.add(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    if (lines === 'solid') {
      mesh.add(new Mesh(this.hullOf(geometry), this.outline));
    }
    if (lines !== 'none') {
      mesh.add(new LineSegments(this.edgesOf(geometry), this.crease));
    }
    return mesh;
  }

  /**
   * The same shape with one normal per corner. With the normals split along a
   * hard edge, pushing the faces out would tear the outline open there.
   */
  private hullOf(geometry: BufferGeometry) {
    let hull = this.hulls.get(geometry);
    if (!hull) {
      const bare = geometry.clone();
      bare.deleteAttribute('normal');
      bare.deleteAttribute('uv');
      hull = mergeVertices(bare);
      hull.computeVertexNormals();
      bare.dispose();
      this.hulls.set(geometry, hull);
    }
    return hull;
  }

  private edgesOf(geometry: BufferGeometry) {
    let edges = this.edges.get(geometry);
    if (!edges) {
      edges = new EdgesGeometry(geometry, CREASE);
      this.edges.set(geometry, edges);
    }
    return edges;
  }

  /** Nose along +Z, about 165 units from nose to the root of the tail. */
  private rat() {
    const { body, coral, hollow, pupil } = this;
    const rat = new Group();
    // Modelled at its own size, then grown to fill the mouth of the barrel.
    const figure = new Group();
    figure.scale.setScalar(RAT_RADIUS / 34);
    rat.add(figure);
    this.part(figure, new SphereGeometry(34, 32, 20), body, 0, 0, 0).scale.set(1, 0.88, 1.45);
    this.part(figure, new SphereGeometry(24, 32, 20), body, 0, 4, 44);
    this.part(figure, along(new ConeGeometry(15, 36, 24)), body, 0, 1, 72);
    this.part(figure, new SphereGeometry(5, 20, 14), coral, 0, 1, 90);
    const paw = new SphereGeometry(7, 20, 14);
    const ear = along(new CylinderGeometry(12, 12, 3, 32));
    const inner = new CircleGeometry(7.5, 24);
    for (const side of [-1, 1]) {
      this.part(figure, new SphereGeometry(3.8, 10, 8), pupil, side * 10.5, 9, 64, 'none');
      this.part(figure, paw, body, side * 17, -25, 34).scale.y = 0.7;
      this.part(figure, paw, body, side * 19, -24, -26).scale.y = 0.7;
      const flap = this.part(figure, ear, body, side * 25, 12, 38);
      flap.rotation.y = side * 0.5;
      this.part(flap, inner, coral, 0, 0, 1.6, 'none');
    }
    const tail = along(new CylinderGeometry(2.5, 5, 84, 10));
    this.part(figure, tail, coral, 0, 6, -84).rotation.x = 0.22;

    const whiskers: number[] = [];
    for (const side of [-1, 1]) {
      for (const fan of [-1, 0, 1]) {
        whiskers.push(side * 6, fan * 2, 80, side * 32, 2 + fan * 7, 74);
      }
    }
    const lines = new BufferGeometry();
    lines.setAttribute('position', new Float32BufferAttribute(whiskers, 3));
    this.geometries.add(lines);
    figure.add(new LineSegments(lines, this.crease));

    // A coral helmet pushed back on the head, flying goggles up on its front.
    const helmet = new Group();
    helmet.position.set(0, 11, 44);
    helmet.rotation.x = -0.35;
    figure.add(helmet);
    const dome = new SphereGeometry(26.5, 32, 12, 0, Math.PI * 2, 0, HALF_TURN);
    this.part(helmet, dome, coral, 0, 0, 0);
    this.part(helmet, new TorusGeometry(26.5, 2.6, 16, 64).rotateX(HALF_TURN), coral, 0, 0, 0);
    const rim = new TorusGeometry(7, 2.2, 16, 32);
    const lens = new CircleGeometry(7, 24);
    for (const side of [-1, 1]) {
      const goggle = this.part(helmet, rim, body, side * 9, 17, 20);
      goggle.rotation.x = -0.69;
      this.part(goggle, lens, hollow, 0, 0, 0, 'none');
    }
    return rat;
  }

  setTones(tones: CannonTones) {
    const ink = new Color(tones.ink);
    const paper = new Color(tones.paper);
    const [lit, shade] = byLight(new Color(tones.surfaces[0]), new Color(tones.surfaces[1]));
    const dark = byLight(ink, paper)[1];
    paint(this.body, lit, shade);
    paint(this.coral, new Color(tones.accent), new Color(tones.accentDeep), 0.3);
    const bore = shade.clone().lerp(dark, 0.4);
    paint(this.hollow, bore, bore);
    // Lit from above, a bore is dark under its upper lip and light on its floor.
    paint(this.lining, bore, shade);
    paint(this.pupil, dark, dark);
    this.outline.uniforms.uColor.value.copy(ink);
    this.crease.color.copy(ink);
  }

  dispose() {
    for (const geometry of [...this.geometries, ...this.hulls.values(), ...this.edges.values()]) {
      geometry.dispose();
    }
    for (const material of [
      this.body,
      this.coral,
      this.hollow,
      this.lining,
      this.pupil,
      this.outline,
      this.crease,
    ]) {
      material.dispose();
    }
  }
}
