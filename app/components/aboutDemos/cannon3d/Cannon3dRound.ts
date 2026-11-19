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
/** What a letter looked like on the page, read before anything on the page is changed. */
type Snapshot = {
  rect: DOMRect;
  inline: boolean;
  type: string[];
  lineHeight: string;
  whiteSpace: string;
};

// The copy lies on the plane z = 0, one unit to a CSS pixel, with the eye this far
// in front of it and the cannon that far behind. Anything past the plane is
// between the page and the viewer, which is where the letters end up.
const EYE = 1100;
const DEPTH = 1500;
/** Where things leave the picture: close enough to the eye to be several times life size. */
const EXIT = EYE * 0.92;
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
const SHAKE_REACH = 3.2;
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
  private readonly ahead = new Vector3();
  private readonly side = new Vector3();
  private readonly up = new Vector3();
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
  /** The barrel is still swinging toward where it is aimed. */
  private turning = false;
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
    private missLabel: () => string,
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
    this.model.setTones({
      ...tones,
      accentDeep: token('--color-accent-dark'),
      surfaces: [token('--color-surface'), token('--color-surface-lighter')],
    });
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
    // The canvas spans the whole section and is mostly empty: past 1.5 the extra
    // pixels cost more than they show.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height, false);
    this.model.setViewport(width, height);
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
    this.turning = true;
  }

  clearAim() {
    this.pointer = null;
  }

  /** Fires where the barrel points now: for a click on the cannon itself. */
  fireAhead() {
    const field = this.mount.getBoundingClientRect();
    const at = this.wanted();
    this.fire({ x: at.x + field.left, y: at.y + field.top }, true);
  }

  /**
   * Fires at a point on the page, or at a letter of its own choosing without one.
   * `hold` keeps the barrel on that point for a moment after the shot.
   */
  fire(client: Point | null, hold = !client) {
    const rat = this.rats.find((candidate) => !candidate.visible);
    if (!this.active || this.cooldown > 0 || !rat) {
      return;
    }
    // Font swaps and the section entrance can move things after mount.
    this.layout();
    const field = this.mount.getBoundingClientRect();
    // Every letter's place is read only when this shot needs it: to pick one to
    // aim at, or to score a shot that is not shown flying.
    const targets = !client || !this.animate ? this.targets(field) : [];
    const pick = targets[Math.floor(Math.random() * targets.length)] ?? this.rest;
    const aim = client
      ? { x: client.x - field.left, y: client.y - field.top }
      : { x: pick.x, y: pick.y };
    if (!this.animate) {
      // Resolve the same shot without displaying motion.
      this.result(this.struck(targets, aim).length * POINTS_PER_LETTER);
      return;
    }
    if (hold) {
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

  private clear() {
    for (const piece of this.loose) {
      piece.clone?.remove();
      piece.target.element.style.removeProperty('opacity');
    }
    this.stillAll();
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
    return RAT_RADIUS * this.scale * 1.35;
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
    shot.rat.position.set(shot.x - this.eye.x, this.eye.y - shot.y, shot.z);
    const ahead = this.ahead.set(shot.vx, -shot.vy, shot.vz).normalize();
    const side = this.side.crossVectors(UP, ahead).normalize();
    this.basis.makeBasis(side, this.up.crossVectors(ahead, side), ahead);
    shot.rat.quaternion.setFromRotationMatrix(this.basis);
    shot.rat.rotateZ(shot.roll);
  }

  private tick = (now: number) => {
    if (!this.active) {
      return;
    }
    const elapsed = now - this.lastFrame;
    const lively =
      this.held ||
      this.shots.length ||
      this.loose.length ||
      this.shaken.length ||
      this.rings.busy ||
      this.recoil > 0 ||
      this.reload > 0 ||
      this.cooldown > 0 ||
      this.noteAge < NOTE_SECONDS;
    // Aimed at a pointer that has stopped, the barrel comes to rest and nothing
    // changes until the pointer moves again, so nothing is drawn. Left alone, it
    // sways, which a lower rate shows well enough.
    const due = this.pointer ? this.turning : elapsed >= IDLE_FRAME_MS - 1;
    if (lively || due) {
      this.lastFrame = now;
      this.step(Math.min(0.05, elapsed / 1000));
      this.render();
    } else if (this.pointer) {
      this.lastFrame = now;
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
    this.turning = Math.abs(yaw - this.yaw) + Math.abs(pitch - this.pitch) > 1e-4;
    this.yaw += (yaw - this.yaw) * ease;
    this.pitch += (pitch - this.pitch) * ease;
    this.recoil = Math.max(0, this.recoil - dt * 3.2);
    if (this.reload > 0) {
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
    const near: Target[] = [];
    for (const target of this.targets(field)) {
      const distance = Math.hypot(target.x - shot.aim.x, target.y - shot.aim.y);
      if (distance <= radius) {
        hits.push(target);
      } else if (distance <= radius * SHAKE_REACH) {
        near.push(target);
      }
    }
    // Everything is read off the page before anything on it is changed: reading
    // after a change makes the browser lay the page out again, once per letter.
    const snapshots = hits.map((target) => this.snapshot(target.element));
    const inline = near.map((target) => this.wasInline(target.element));
    for (const [index, target] of hits.entries()) {
      const dx = target.x - shot.aim.x;
      const dy = target.y - shot.aim.y;
      this.loosen(target, snapshots[index], shot, dx, dy, Math.hypot(dx, dy) / radius);
    }
    for (const [index, target] of near.entries()) {
      const dx = target.x - shot.aim.x;
      const dy = target.y - shot.aim.y;
      const distance = Math.hypot(dx, dy);
      this.shake(target.element, inline[index], dx / distance, dy / distance, distance, radius);
    }
    this.rings.open(
      this.world({ ...shot.aim, z: 0 }),
      null,
      this.ink,
      radius * 0.5,
      radius * SHAKE_REACH,
      (radius * (SHAKE_REACH - 1)) / SHAKE_SPEED + 0.12,
      0.45,
    );
    this.note.textContent = hits.length
      ? `+${hits.length * POINTS_PER_LETTER}`
      : this.missLabel().toUpperCase();
    this.note.dataset.hit = String(hits.length > 0);
    this.notePoint = { x: shot.aim.x, y: shot.aim.y - 18 };
    this.noteAge = 0;
    this.result(hits.length * POINTS_PER_LETTER);
  }

  /** Whether a letter is inline on the page, whatever a shake has made it for now. */
  private wasInline(element: HTMLElement) {
    const shaking = this.shaken.find((piece) => piece.element === element);
    return shaking ? shaking.inline : getComputedStyle(element).display === 'inline';
  }

  private snapshot(element: HTMLElement): Snapshot {
    const type = getComputedStyle(element);
    return {
      rect: element.getBoundingClientRect(),
      inline: this.wasInline(element),
      type: TYPE.map((property) => type.getPropertyValue(property)),
      lineHeight: type.lineHeight,
      whiteSpace: type.whiteSpace,
    };
  }

  /** Lifts a letter off the page as a stand-in that can fly anywhere on screen. */
  private loosen(target: Target, seen: Snapshot, shot: Shot, dx: number, dy: number, away: number) {
    const shaking = this.shaken.find((piece) => piece.element === target.element);
    if (shaking) {
      this.still(shaking);
      this.shaken = this.shaken.filter((piece) => piece !== shaking);
    }
    const { rect, inline } = seen;
    const clone = target.element.cloneNode(true) as HTMLElement;
    delete clone.dataset.target;
    for (const [index, property] of TYPE.entries()) {
      clone.style.setProperty(property, seen.type[index]);
    }
    Object.assign(clone.style, {
      position: 'absolute',
      display: 'block',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      // An inline box is as tall as its glyphs, so that height is its line too.
      lineHeight: inline ? `${rect.height}px` : seen.lineHeight,
      whiteSpace: inline ? 'pre' : seen.whiteSpace,
    });
    this.layer.append(clone);
    target.element.style.opacity = '0';

    const turn = away > 0.02 ? Math.atan2(dy, dx) : between(0, Math.PI * 2);
    // A modest push sideways: the growth toward the eye does most of the spreading.
    const push = between(140, 420);
    this.loose.push({
      target,
      clone,
      from: shot.aim,
      x: target.x,
      y: target.y,
      z: 0,
      vx: Math.cos(turn) * push + shot.vx * 0.12,
      vy: Math.sin(turn) * push - between(120, 380),
      vz: between(1100, 2000) * (1 - 0.35 * away),
      axis: `${between(-1, 1).toFixed(2)},${between(-1, 1).toFixed(2)},${between(-1, 1).toFixed(2)}`,
      angle: 0,
      spin: between(4, 11) * (Math.random() < 0.5 ? -1 : 1),
      // Negative age waits; nearer the middle leaves first.
      age: -0.08 * away,
    });
  }

  private shake(
    element: HTMLElement,
    inline: boolean,
    dx: number,
    dy: number,
    distance: number,
    radius: number,
  ) {
    const span = radius * (SHAKE_REACH - 1);
    const at = this.shaken.findIndex((other) => other.element === element);
    // A transform does nothing on an inline box, and the copy's letters are
    // inline. They all change box together as the wave sets off, so the copy is
    // laid out again once, not once for each letter the wave reaches.
    if (inline) {
      element.style.display = 'inline-block';
    }
    const piece = {
      element,
      inline,
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

  private stillAll() {
    for (const piece of this.shaken) {
      this.still(piece);
    }
    this.shaken = [];
  }

  private stepShaken(dt: number) {
    if (!this.shaken.length) {
      return;
    }
    let shaking = false;
    for (const piece of this.shaken) {
      piece.age += dt;
      if (piece.age < 0) {
        shaking = true;
        continue;
      }
      if (piece.age >= SHAKE_SECONDS) {
        piece.element.style.removeProperty('transform');
        continue;
      }
      shaking = true;
      const swing = piece.force * Math.exp(-6.5 * piece.age) * Math.sin(20 * piece.age);
      const out = 24 * swing;
      piece.element.style.transform = `translate(${piece.dx * out}px,${piece.dy * out}px) rotate(${0.22 * swing * piece.dx}rad)`;
    }
    // Every letter goes back to its own box at once, when the last one is still.
    if (!shaking) {
      this.stillAll();
    }
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
      const pop = 1 + 0.45 * Math.exp(-14 * piece.age);
      const clone = piece.clone.style;
      clone.transform = `translate(${x}px,${y}px) scale(${near * pop}) rotate3d(${piece.axis},${piece.angle}rad)`;
      clone.opacity = String(Math.min(1, (EXIT - piece.z) / (EYE * 0.22)));
      // In a few steps: each new blur has the letter, many times its size, drawn again.
      const soft = near < 2.4 ? 0 : near < 3.4 ? 2 : near < 4.6 ? 4 : 7;
      clone.filter = soft ? `blur(${soft}px)` : '';
      return true;
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}
