import {
  Color,
  type Group,
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

import { CannonModel, GROUND, HALF_WIDTH, HEIGHT, MUZZLE, RAT_RADIUS } from './cannon3dModel';
import { CannonGround, Rings } from './cannon3dStage';

type Point = { x: number; y: number };
type Space = Point & { z: number };
type Velocity = { vx: number; vy: number; vz: number };
type Target = Point & { element: HTMLElement };
type Shot = Space & Velocity & { rat: Group; aim: Point; landed: boolean; roll: number };
type Loose = Space &
  Velocity & {
    target: Target;
    /** The letter's stand-in while it is in the air; gone once it has left the screen. */
    clone: HTMLElement | null;
    /** Where the rat landed. */
    from: Point;
    axis: string;
    angle: number;
    spin: number;
    age: number;
  };
/** A letter near the impact that is shoved outward and springs back. */
type Shaken = {
  element: HTMLElement;
  inline: boolean;
  dx: number;
  dy: number;
  force: number;
  age: number;
};

// The copy lies on the plane z = 0, one unit to a CSS pixel, with the eye this far
// in front of it and the cannon that far behind. Anything past the plane is
// between the page and the viewer, which is where the letters end up.
const EYE = 1100;
const DEPTH = 1500;
/** Where things leave the picture: close enough to the eye to be several times life size. */
const EXIT = EYE * 0.85;
const FLIGHT_SECONDS = 0.5;
const SHOT_GRAVITY = 1800;
const MAX_SHOTS = 6;
const COOLDOWN_SECONDS = 0.1;
const RELOAD_SECONDS = 0.2;
/** How long the barrel keeps pointing where a shot it aimed itself went. */
const HOLD_SECONDS = 0.35;
const LOOSE_GRAVITY = 520;
const RETURN_AT = 1.9;
const RETURN_FADE = 0.3;
/** The shockwave reaches this many blast radii, travelling this fast in pixels a second. */
const SHAKE_REACH = 2.8;
const SHAKE_SPEED = 1100;
const SHAKE_SECONDS = 0.75;
const NOTE_SECONDS = 1.2;
const IDLE_FRAME_MS = 1000 / 30;
const POINTS_PER_LETTER = 10;
const UP = new Vector3(0, 1, 0);
/**
 * The canvas covers the whole section, and the rats and the floor run past it.
 * They dissolve at its top and bottom edges instead of being cut off.
 */
const EDGE_FADE =
  'linear-gradient(to bottom, transparent, #000 4.5rem, #000 calc(100% - 4.5rem), transparent)';

/** Type the stand-in has to carry itself: it leaves the copy, so it inherits none of it. */
const TYPE = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-stretch',
  'font-variation-settings',
  'font-feature-settings',
  'letter-spacing',
  'text-transform',
  'color',
];

const between = (low: number, high: number) => low + Math.random() * (high - low);

export class Cannon3dRound {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera();
  private readonly model = new CannonModel();
  private readonly ground = new CannonGround();
  private readonly rings = new Rings(MAX_SHOTS * 2);
  private readonly rats: Group[] = [];
  /** Above the whole page, so letters can fly past the section's own edges. */
  private readonly layer = document.createElement('div');
  private readonly basis = new Matrix4();
  private readonly facing = new Quaternion();
  private readonly ink = new Color();
  private readonly accent = new Color();
  private width = 1;
  private height = 1;
  private scale = 1;
  /** The point on the page the eye is level with and straight in front of. */
  private eye: Point = { x: 0, y: 0 };
  private pivot: Space = { x: 0, y: 0, z: -DEPTH };
  private rest: Point = { x: 0, y: 0 };
  private reach: Point = { x: 0, y: 0 };
  private frame = 0;
  private active = false;
  private lastFrame = 0;
  private time = 0;
  private yaw = 0;
  private pitch = 0;
  private recoil = 0;
  private reload = 0;
  private cooldown = 0;
  private pointer: Point | null = null;
  private held: Point | null = null;
  private holding = 0;
  private shots: Shot[] = [];
  private loose: Loose[] = [];
  private shaken: Shaken[] = [];
  private noteAge = NOTE_SECONDS;
  private notePoint: Point = { x: 0, y: 0 };

  constructor(
    private mount: HTMLElement,
    private stage: HTMLElement,
    private copy: HTMLElement,
    private note: HTMLElement,
    private animate: boolean,
    private missLabel: string,
    private result: (points: number) => void,
  ) {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.className = 'absolute inset-0 h-full w-full';
    canvas.style.maskImage = EDGE_FADE;
    canvas.setAttribute('aria-hidden', 'true');
    mount.append(canvas);
    this.layer.className = 'pointer-events-none fixed inset-0 z-50 overflow-hidden';
    this.layer.setAttribute('aria-hidden', 'true');
    document.body.append(this.layer);
    for (let i = 0; i < MAX_SHOTS; i++) {
      this.rats.push(this.model.spawnRat());
    }
    this.scene.add(this.ground.group, this.model.root, ...this.rats, this.rings.group);
    this.camera.position.z = EYE;
    this.camera.near = 20;
    this.camera.far = EYE + DEPTH * 3;
    this.restyle();
    this.resize();
  }

  /** Picks up the theme's colours again; call it once the theme has changed. */
  restyle() {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const tones = {
      ink: token('--color-text'),
      paper: token('--color-bg'),
      accent: token('--color-accent'),
    };
    this.model.setTones(tones);
    this.ink.set(tones.ink);
    this.accent.set(tones.accent);
    const paper = new Color(tones.paper);
    const inkIsDark = this.ink.r + this.ink.g + this.ink.b < paper.r + paper.g + paper.b;
    this.ground.setTones(this.ink, inkIsDark ? this.ink : paper);
    this.render();
  }

  resize() {
    const { width, height } = this.mount.getBoundingClientRect();
    if (!width || !height) {
      return;
    }
    this.width = width;
    this.height = height;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.layout();
    this.settle();
    this.render();
  }

  setActive(active: boolean) {
    cancelAnimationFrame(this.frame);
    this.active = active;
    if (!active) {
      this.clear();
      this.render();
      return;
    }
    this.layout();
    this.settle();
    this.lastFrame = performance.now();
    this.render();
    if (this.animate) {
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  aimAt(clientX: number, clientY: number) {
    const field = this.mount.getBoundingClientRect();
    this.pointer = { x: clientX - field.left, y: clientY - field.top };
  }

  clearAim() {
    this.pointer = null;
  }

  /** Fires at a point on the page, or at a letter of its own choosing without one. */
  fire(client: Point | null) {
    const rat = this.rats.find((candidate) => !candidate.visible);
    if (!this.active || this.cooldown > 0 || !rat) {
      return;
    }
    // Font swaps and the section entrance can move things after mount.
    this.layout();
    const field = this.mount.getBoundingClientRect();
    const targets = this.targets(field);
    const pick = targets[Math.floor(Math.random() * targets.length)] ?? this.rest;
    const aim = client
      ? { x: client.x - field.left, y: client.y - field.top }
      : { x: pick.x, y: pick.y };
    if (!this.animate) {
      // Resolve the same shot without displaying motion.
      this.result(this.struck(targets, aim).length * POINTS_PER_LETTER);
      return;
    }
    if (!client) {
      this.held = aim;
      this.holding = HOLD_SECONDS;
    }
    this.point(this.launch(this.pivot, aim));
    this.recoil = 0;
    this.pose();
    this.model.root.updateMatrixWorld(true);
    const mouth = this.model.barrel.localToWorld(new Vector3(0, 0, MUZZLE));
    const from = { x: mouth.x + this.eye.x, y: this.eye.y - mouth.y, z: mouth.z };
    const shot = { ...from, ...this.launch(from, aim), rat, aim, landed: false, roll: 0 };
    this.shots.push(shot);
    rat.visible = true;
    this.placeShot(shot);
    this.model.barrel.getWorldQuaternion(this.facing);
    this.rings.open(mouth, this.facing, this.accent, 60 * this.scale, 170 * this.scale, 0.3, 0.8);
    this.recoil = 1;
    this.cooldown = COOLDOWN_SECONDS;
    this.reload = RELOAD_SECONDS;
    this.model.passenger.visible = false;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.active = false;
    this.clear();
    this.layer.remove();
    this.model.dispose();
    this.ground.dispose();
    this.rings.dispose();
    this.renderer.dispose();
    // Hand the GL context back now rather than whenever the canvas is collected;
    // browsers cap how many can be alive at once.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  /** Puts every letter back and empties the air. */
  private clear() {
    for (const piece of this.loose) {
      piece.clone?.remove();
      piece.target.element.style.removeProperty('opacity');
    }
    for (const piece of this.shaken) {
      this.still(piece);
    }
    for (const shot of this.shots) {
      shot.rat.visible = false;
    }
    this.loose = [];
    this.shaken = [];
    this.shots = [];
    this.rings.clear();
    this.pointer = null;
    this.held = null;
    this.recoil = 0;
    this.reload = 0;
    this.cooldown = 0;
    this.noteAge = NOTE_SECONDS;
    this.note.style.opacity = '0';
    this.model.passenger.visible = true;
    this.model.passenger.scale.setScalar(1);
    this.model.tube.position.z = 0;
  }

  /**
   * Sets the eye level with the top of the stage and stands the cannon on the
   * stage's bottom edge, as far back as `DEPTH`: looking slightly down on it is
   * what lets the floor show.
   */
  private layout() {
    const field = this.mount.getBoundingClientRect();
    const stage = this.stage.getBoundingClientRect();
    const copy = this.copy.getBoundingClientRect();
    this.eye = {
      x: this.width / 2,
      y: Math.max(0, Math.min(this.height, stage.top - field.top)),
    };
    // The canvas is a window onto a taller picture that has the eye at its middle.
    const tall = 2 * Math.max(this.eye.y, this.height - this.eye.y);
    this.camera.fov = (2 * Math.atan(tall / 2 / EYE) * 180) / Math.PI;
    this.camera.aspect = this.width / tall;
    this.camera.setViewOffset(this.width, tall, 0, tall / 2 - this.eye.y, this.width, this.height);
    this.camera.updateProjectionMatrix();

    const far = (EYE + DEPTH) / EYE;
    const onScreen = Math.min(
      (stage.width * 0.62) / (2 * HALF_WIDTH),
      (stage.height * 0.9) / HEIGHT,
    );
    this.scale = onScreen * far;
    const x = stage.left - field.left + stage.width / 2;
    const y = stage.bottom - field.top - GROUND * onScreen;
    this.pivot = {
      x: this.eye.x + (x - this.eye.x) * far,
      y: this.eye.y + (y - this.eye.y) * far,
      z: -DEPTH,
    };
    this.model.root.position.copy(this.world(this.pivot));
    this.model.root.scale.setScalar(this.scale);
    for (const rat of this.rats) {
      rat.scale.setScalar(this.scale);
    }
    this.ground.place(
      this.world({ ...this.pivot, y: this.pivot.y + GROUND * this.scale }),
      150 * this.scale,
      1.5,
    );
    this.rest = {
      x: copy.left - field.left + copy.width / 2,
      y: copy.top - field.top + copy.height / 2,
    };
    this.reach = { x: copy.width * 0.3, y: copy.height * 0.3 };
  }

  private targets(field: DOMRect): Target[] {
    const taken = new Set(this.loose.map((piece) => piece.target.element));
    return [...this.copy.querySelectorAll<HTMLElement>('[data-target]')]
      .filter((element) => !taken.has(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          x: rect.left - field.left + rect.width / 2,
          y: rect.top - field.top + rect.height / 2,
        };
      });
  }

  /** How far from the point of impact a letter is still carried off. */
  private blast() {
    return RAT_RADIUS * this.scale * 1.1;
  }

  private struck(targets: Target[], at: Point) {
    const radius = this.blast();
    return targets.filter((target) => Math.hypot(target.x - at.x, target.y - at.y) <= radius);
  }

  /** Game space has y pointing down the page; three.js has it pointing up. */
  private world(point: Space) {
    return new Vector3(point.x - this.eye.x, this.eye.y - point.y, point.z);
  }

  /** The velocity that carries something from `from` through `to` on the page plane. */
  private launch(from: Space, to: Point): Velocity {
    return {
      vx: (to.x - from.x) / FLIGHT_SECONDS,
      vy: (to.y - from.y) / FLIGHT_SECONDS - 0.5 * SHOT_GRAVITY * FLIGHT_SECONDS,
      vz: -from.z / FLIGHT_SECONDS,
    };
  }

  private heading({ vx, vy, vz }: Velocity) {
    return { yaw: Math.atan2(vx, vz), pitch: Math.atan2(-vy, Math.hypot(vx, vz)) };
  }

  private point(velocity: Velocity) {
    const { yaw, pitch } = this.heading(velocity);
    this.yaw = yaw;
    this.pitch = pitch;
  }

  private wanted(): Point {
    return (
      this.held ??
      this.pointer ?? {
        x: this.rest.x + this.reach.x * Math.cos(this.time * 0.7),
        y: this.rest.y + this.reach.y * Math.sin(this.time * 1.1),
      }
    );
  }

  /** Points the barrel where it wants to be at once, for a still frame. */
  private settle() {
    this.point(this.launch(this.pivot, this.wanted()));
    this.pose();
  }

  private pose() {
    this.model.root.rotation.y = this.yaw;
    this.model.barrel.rotation.x = -this.pitch;
    this.model.tube.position.z = -52 * this.recoil ** 2;
  }

  private placeShot(shot: Shot) {
    shot.rat.position.copy(this.world(shot));
    const ahead = new Vector3(shot.vx, -shot.vy, shot.vz).normalize();
    const side = new Vector3().crossVectors(UP, ahead).normalize();
    this.basis.makeBasis(side, new Vector3().crossVectors(ahead, side), ahead);
    shot.rat.quaternion.setFromRotationMatrix(this.basis);
    shot.rat.rotateZ(shot.roll);
  }

  private tick = (now: number) => {
    if (!this.active) {
      return;
    }
    const elapsed = now - this.lastFrame;
    const lively =
      this.pointer ||
      this.held ||
      this.shots.length ||
      this.loose.length ||
      this.shaken.length ||
      this.rings.busy ||
      this.recoil > 0 ||
      this.reload > 0 ||
      this.cooldown > 0 ||
      this.noteAge < NOTE_SECONDS;
    if (lively || elapsed >= IDLE_FRAME_MS - 1) {
      this.lastFrame = now;
      this.step(Math.min(0.05, elapsed / 1000));
      this.render();
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private step(dt: number) {
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.holding -= dt;
    if (this.holding <= 0) {
      this.held = null;
    }
    const ease = 1 - Math.exp(-dt * 14);
    const { yaw, pitch } = this.heading(this.launch(this.pivot, this.wanted()));
    this.yaw += (yaw - this.yaw) * ease;
    this.pitch += (pitch - this.pitch) * ease;
    this.recoil = Math.max(0, this.recoil - dt * 3.2);
    if (this.reload > 0) {
      // The next rat pops up in the mouth, a little too far, then settles.
      this.reload = Math.max(0, this.reload - dt);
      const up = 1 - this.reload / RELOAD_SECONDS;
      this.model.passenger.visible = true;
      this.model.passenger.scale.setScalar(Math.max(0.01, up + 0.35 * Math.sin(up * Math.PI)));
    }
    this.pose();
    this.stepShots(dt);
    this.stepLoose(dt);
    this.stepShaken(dt);
    this.rings.step(dt);
    if (this.noteAge < NOTE_SECONDS) {
      this.noteAge += dt;
      const { x, y } = this.notePoint;
      this.note.style.transform = `translate(${x}px,${y - 34 * this.noteAge}px) translate(-50%,-100%)`;
      this.note.style.opacity = String(Math.max(0, Math.min(1, (NOTE_SECONDS - this.noteAge) * 3)));
    }
  }

  private stepShots(dt: number) {
    this.shots = this.shots.filter((shot) => {
      shot.x += shot.vx * dt;
      shot.y += (shot.vy + SHOT_GRAVITY * dt * 0.5) * dt;
      shot.vy += SHOT_GRAVITY * dt;
      shot.z += shot.vz * dt;
      shot.roll += dt * 5;
      if (!shot.landed && shot.z >= 0) {
        shot.landed = true;
        this.land(shot);
      }
      if (shot.z >= EXIT) {
        shot.rat.visible = false;
        return false;
      }
      this.placeShot(shot);
      return true;
    });
  }

  private land(shot: Shot) {
    const field = this.mount.getBoundingClientRect();
    const radius = this.blast();
    const hits: Target[] = [];
    for (const target of this.targets(field)) {
      const dx = target.x - shot.aim.x;
      const dy = target.y - shot.aim.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= radius) {
        hits.push(target);
        this.loosen(target, shot, dx, dy, distance / radius);
      } else if (distance <= radius * SHAKE_REACH) {
        this.shake(target.element, dx / distance, dy / distance, distance, radius);
      }
    }
    this.rings.open(
      this.world({ ...shot.aim, z: 0 }),
      null,
      this.ink,
      radius * 0.5,
      radius * SHAKE_REACH,
      (radius * (SHAKE_REACH - 1)) / SHAKE_SPEED + 0.12,
      0.32,
    );
    this.note.textContent = hits.length
      ? `+${hits.length * POINTS_PER_LETTER}`
      : this.missLabel.toUpperCase();
    this.note.dataset.hit = String(hits.length > 0);
    this.notePoint = { x: shot.aim.x, y: shot.aim.y - 18 };
    this.noteAge = 0;
    this.result(hits.length * POINTS_PER_LETTER);
  }

  /** Lifts a letter off the page as a stand-in that can fly anywhere on screen. */
  private loosen(target: Target, shot: Shot, dx: number, dy: number, away: number) {
    const shaking = this.shaken.find((piece) => piece.element === target.element);
    if (shaking) {
      this.still(shaking);
      this.shaken = this.shaken.filter((piece) => piece !== shaking);
    }
    const rect = target.element.getBoundingClientRect();
    const type = getComputedStyle(target.element);
    const inline = type.display === 'inline';
    const clone = target.element.cloneNode(true) as HTMLElement;
    delete clone.dataset.target;
    for (const property of TYPE) {
      clone.style.setProperty(property, type.getPropertyValue(property));
    }
    Object.assign(clone.style, {
      position: 'absolute',
      display: 'block',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      // An inline box is as tall as its glyphs, so that height is its line too.
      lineHeight: inline ? `${rect.height}px` : type.lineHeight,
      whiteSpace: inline ? 'pre' : type.whiteSpace,
    });
    this.layer.append(clone);
    target.element.style.opacity = '0';

    const turn = away > 0.02 ? Math.atan2(dy, dx) : between(0, Math.PI * 2);
    // A modest push sideways: the growth toward the eye does most of the spreading.
    const push = between(90, 300);
    this.loose.push({
      target,
      clone,
      from: shot.aim,
      x: target.x,
      y: target.y,
      z: 0,
      vx: Math.cos(turn) * push + shot.vx * 0.12,
      vy: Math.sin(turn) * push - between(60, 260),
      vz: between(650, 1500),
      axis: `${between(-1, 1).toFixed(2)},${between(-1, 1).toFixed(2)},${between(-1, 1).toFixed(2)}`,
      angle: 0,
      spin: between(3, 9) * (Math.random() < 0.5 ? -1 : 1),
      // The ones nearest the middle leave first, so the burst opens outward.
      age: -0.08 * away,
    });
  }

  private shake(element: HTMLElement, dx: number, dy: number, distance: number, radius: number) {
    const span = radius * (SHAKE_REACH - 1);
    const at = this.shaken.findIndex((other) => other.element === element);
    const piece = {
      element,
      // Its box may already be changed for an earlier wave; keep what it really was.
      inline: at === -1 ? getComputedStyle(element).display === 'inline' : this.shaken[at].inline,
      dx,
      dy,
      force: 1 - (distance - radius) / span,
      age: -(distance - radius) / SHAKE_SPEED,
    };
    if (at === -1) {
      this.shaken.push(piece);
    } else {
      this.shaken[at] = piece;
    }
  }

  private still(piece: Shaken) {
    piece.element.style.removeProperty('transform');
    if (piece.inline) {
      piece.element.style.removeProperty('display');
    }
  }

  private stepShaken(dt: number) {
    if (!this.shaken.length) {
      return;
    }
    this.shaken = this.shaken.filter((piece) => {
      piece.age += dt;
      if (piece.age < 0) {
        return true;
      }
      if (piece.age >= SHAKE_SECONDS) {
        this.still(piece);
        return false;
      }
      // A transform does nothing on an inline box, and the copy's letters are inline.
      if (piece.inline) {
        piece.element.style.display = 'inline-block';
      }
      const swing = piece.force * Math.exp(-6.5 * piece.age) * Math.sin(20 * piece.age);
      const out = 18 * swing;
      piece.element.style.transform = `translate(${piece.dx * out}px,${piece.dy * out}px) rotate(${0.22 * swing * piece.dx}rad)`;
      return true;
    });
  }

  private stepLoose(dt: number) {
    if (!this.loose.length) {
      return;
    }
    this.loose = this.loose.filter((piece) => {
      piece.age += dt;
      const style = piece.target.element.style;
      if (piece.age >= RETURN_AT + RETURN_FADE) {
        piece.clone?.remove();
        style.removeProperty('opacity');
        return false;
      }
      if (piece.age >= RETURN_AT) {
        piece.clone?.remove();
        piece.clone = null;
        style.opacity = String((piece.age - RETURN_AT) / RETURN_FADE);
        return true;
      }
      if (piece.age < 0 || !piece.clone) {
        return true;
      }
      piece.vy += LOOSE_GRAVITY * dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.z += piece.vz * dt;
      piece.angle += piece.spin * dt;
      if (piece.z >= EXIT) {
        piece.clone.remove();
        piece.clone = null;
        return true;
      }
      // What is nearer the eye is drawn larger and further from the centre. Each
      // burst has its own centre, the point of impact: seen from the middle of a
      // wide section, letters from its edge would only slide off sideways.
      const near = EYE / (EYE - piece.z);
      const x = piece.from.x + (piece.x - piece.from.x) * near - piece.target.x;
      const y = piece.from.y + (piece.y - piece.from.y) * near - piece.target.y;
      const clone = piece.clone.style;
      clone.transform = `translate(${x}px,${y}px) scale(${near}) rotate3d(${piece.axis},${piece.angle}rad)`;
      clone.opacity = String(Math.min(1, (EXIT - piece.z) / (EYE * 0.22)));
      // Past the focus of the page they soften, like anything too close to a lens.
      const soft = Math.min(7, (near - 2) * 1.8);
      clone.filter = soft > 0.4 ? `blur(${soft.toFixed(1)}px)` : '';
      return true;
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}
