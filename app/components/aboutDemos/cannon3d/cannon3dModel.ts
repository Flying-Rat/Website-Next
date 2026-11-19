import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
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
  Vector3,
} from 'three';

import { type DemoLook, blockLight, ratTones } from '../demoLook';

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

// The demos' shared light, on round parts: what faces up takes all of it and
// the rest falls away softly, darkest underneath. No outline and no hard step
// between tones; the shading alone has to tell the parts apart.
const VERTEX = /* glsl */ `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLight;
  varying vec3 vNormal;

  ${blockLight}

  void main() {
    // Seen from inside, as the bore's lining is, a surface faces the other way.
    vec3 normal = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    float light = blockLight(normal, uLight, 0.5 + 0.5 * normal.y);
    gl_FragColor = vec4(uColor * light, 1.0);
    #include <colorspace_fragment>
  }
`;

// In view space, which is the world's here, since the eye never turns: the
// light stays put while the cannon turns under it.
const LIGHT = new Vector3(-0.5, 0.6, 0.62).normalize();

function tone() {
  return new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uColor: { value: new Color() },
      uLight: { value: LIGHT },
    },
  });
}

function paint(material: ShaderMaterial, color: Color) {
  material.uniforms.uColor.value.copy(color);
}

/** Cylinders and cones are built upright; these lay one along the barrel or the axle. */
const along = (geometry: BufferGeometry) => geometry.rotateX(HALF_TURN);
const across = (geometry: BufferGeometry) => geometry.rotateZ(HALF_TURN);

/**
 * Softly shaded in the page's stone tones. Everything points along +Z, toward
 * the viewer: `root` turns left and right, `barrel` tips up and down, `tube`
 * slides back on recoil.
 */
export class CannonModel {
  readonly root = new Group();
  readonly barrel = new Group();
  readonly tube = new Group();
  /** The rat loaded in the barrel. */
  readonly passenger: Group;

  private readonly stone = tone();
  /** The mount, a step down the stone's range: it stands lower than the barrel. */
  private readonly mount = tone();
  private readonly coral = tone();
  private readonly hollow = tone();
  /** The inside of the bore, seen from within: its far wall faces away from the eye. */
  private readonly lining = Object.assign(tone(), { side: BackSide });
  private readonly fur = tone();
  private readonly eye = tone();
  private readonly whisker = new LineBasicMaterial();
  private readonly geometries = new Set<BufferGeometry>();

  constructor() {
    const { stone, mount, coral, hollow, lining } = this;
    const { tube, barrel, root } = this;

    // The barrel: a plain tube with a heavier breech and collar, one coral band.
    this.part(tube, along(new CylinderGeometry(30, 30, 14, 32)), stone, 0, 0, -117);
    this.part(tube, along(new CylinderGeometry(62, 62, 56, 48)), stone, 0, 0, -82);
    this.part(tube, along(new CylinderGeometry(56, 56, 250, 48)), stone, 0, 0, 71);
    this.part(tube, along(new CylinderGeometry(58, 58, 9, 48)), coral, 0, 0, 178);
    // The collar is a real opening, a lined bore with a floor, so the rat sits in
    // the barrel instead of being cut off by a lid on its mouth.
    const open = (radius: number, length: number) =>
      along(new CylinderGeometry(radius, radius, length, 48, 1, true));
    this.part(tube, open(64, 54), stone, 0, 0, MUZZLE - 27);
    this.part(tube, new RingGeometry(48, 64, 48), stone, 0, 0, MUZZLE);
    this.part(tube, open(48, 54), lining, 0, 0, MUZZLE - 27);
    this.part(tube, new CircleGeometry(48, 48), hollow, 0, 0, MUZZLE - 53);
    this.passenger = this.rat();
    this.passenger.position.z = MUZZLE - 40;
    tube.add(this.passenger);
    barrel.add(tube);
    // Pins through the yoke, showing just past its arms.
    this.part(barrel, across(new CylinderGeometry(15, 15, 196, 24)), mount, 0, 0, 0);
    root.add(barrel);

    // A turntable on a plinth, and a yoke holding the barrel by its pins.
    this.part(root, new CylinderGeometry(112, 116, 14, 64), mount, 0, 7 - GROUND, 0);
    this.part(root, new CylinderGeometry(86, 86, 12, 64), mount, 0, 20 - GROUND, 0);
    this.part(root, new BoxGeometry(172, 12, 60), mount, 0, 32 - GROUND, 0);
    const arm = new BoxGeometry(14, GROUND - 38, 60);
    const cap = across(new CylinderGeometry(30, 30, 14, 40));
    for (const x of [-79, 79]) {
      this.part(root, arm, mount, x, (38 - GROUND) / 2, 0);
      this.part(root, cap, mount, x, 0, 0);
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

  private part(
    parent: Object3D,
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

  /** Nose along +Z, about 165 units from nose to the root of the tail. */
  private rat() {
    const { stone, coral, hollow, fur, eye } = this;
    const rat = new Group();
    // Modelled at its own size, then grown to fill the mouth of the barrel.
    const figure = new Group();
    figure.scale.setScalar(RAT_RADIUS / 34);
    rat.add(figure);
    this.part(figure, new SphereGeometry(34, 32, 20), fur, 0, 0, 0).scale.set(1, 0.88, 1.45);
    this.part(figure, new SphereGeometry(24, 32, 20), fur, 0, 4, 44);
    this.part(figure, along(new ConeGeometry(15, 36, 24)), fur, 0, 1, 72);
    this.part(figure, new SphereGeometry(5, 20, 14), coral, 0, 1, 90);
    const paw = new SphereGeometry(7, 20, 14);
    const ear = along(new CylinderGeometry(12, 12, 3, 32));
    const inner = new CircleGeometry(7.5, 24);
    for (const side of [-1, 1]) {
      this.part(figure, new SphereGeometry(3.8, 10, 8), eye, side * 10.5, 9, 64);
      this.part(figure, paw, fur, side * 17, -25, 34).scale.y = 0.7;
      this.part(figure, paw, fur, side * 19, -24, -26).scale.y = 0.7;
      const flap = this.part(figure, ear, fur, side * 25, 12, 38);
      flap.rotation.y = side * 0.5;
      this.part(flap, inner, coral, 0, 0, 1.6);
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
    figure.add(new LineSegments(lines, this.whisker));

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
      const goggle = this.part(helmet, rim, stone, side * 9, 17, 20);
      goggle.rotation.x = -0.69;
      this.part(goggle, lens, hollow, 0, 0, 0);
    }
    return rat;
  }

  setLook(look: DemoLook) {
    const rat = ratTones(look);
    paint(this.stone, look.high);
    paint(this.mount, look.low.clone().lerp(look.high, 0.45));
    paint(this.coral, look.accent);
    // Stone out of the light, but short of the fur, so the rat shows against it.
    const bore = look.low.clone().multiplyScalar(0.6);
    paint(this.hollow, bore);
    paint(this.lining, bore);
    paint(this.fur, rat.fur);
    paint(this.eye, rat.eye);
    this.whisker.color.copy(rat.eye);
  }

  dispose() {
    for (const geometry of this.geometries) {
      geometry.dispose();
    }
    for (const material of [
      this.stone,
      this.mount,
      this.coral,
      this.hollow,
      this.lining,
      this.fur,
      this.eye,
      this.whisker,
    ]) {
      material.dispose();
    }
  }
}
