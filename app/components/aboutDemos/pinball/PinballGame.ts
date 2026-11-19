import {
  Color,
  DirectionalLight,
  type Group,
  Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  NeutralToneMapping,
  PCFShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  type RingGeometry,
  Scene,
  type Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { BrickField } from './pinballBricks';
import { BRICK_TALL, DECK, PinballModels, onTable } from './pinballModels';
import {
  BALL_RADIUS,
  BLAST,
  HEIGHT,
  type Point,
  SERVE_SECONDS,
  type Table,
  type TableEvent,
  WIDTH,
  advance,
  generate,
} from './pinballTable';

/** `ready` while a ball waits for the player to drop it. */
export type PinballState = { balls: number; phase: Table['phase']; ready: boolean };

type Ring = {
  mesh: Mesh<RingGeometry, MeshBasicMaterial>;
  age: number;
  life: number;
  from: number;
  to: number;
  strength: number;
};

const RINGS = 8;
const GHOSTS = 5;
/** Waiting for the player, only the soft pulses move; they need no more than this. */
const IDLE_FRAME_MS = 1000 / 30;
/** How long the result stays up before the table is cleared away. */
const WON_SECONDS = 2;
const LOST_SECONDS = 1.6;
const LEAVE_SECONDS = 0.3;
/** How high above the table a new ball starts its drop. */
const DROP_HEIGHT = 220;
/** The camera stands at the flipper end, this far above the table's plane, in radians. */
const ELEVATION = 0.98;
const DISTANCE = 1500;
/** How much of the view's half-height or half-width the table may take. */
const FILL = 0.88;
/** The floor's grid would otherwise stop dead at the top and bottom of the view. */
const EDGE_FADE =
  'linear-gradient(to bottom, transparent, #000 2.5rem, #000 calc(100% - 2.5rem), transparent)';
/** From the front left and well above, so shadows fall away from the viewer and to the right. */
const SUN = new Vector3(-240, 700, 360);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export class PinballGame {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(26, 1, 100, 4000);
  private readonly sun = new DirectionalLight(0xffffff, 3);
  private readonly environment: Texture;
  private readonly models: PinballModels;
  private readonly field: BrickField;
  private readonly flippers: Group[] = [];
  private readonly bumpers: { group: Group; cap: MeshStandardMaterial }[] = [];
  private readonly ball: Mesh;
  private readonly ghosts: Mesh[] = [];
  private readonly ballShadow: Mesh;
  private readonly goalRing: Mesh;
  /** Where the waiting ball will land, pulsing until the player drops it. */
  private readonly marker: Mesh<RingGeometry, MeshBasicMaterial>;
  private readonly rings: Ring[] = [];
  private readonly accent = new Color();
  private readonly ink = new Color();
  private readonly lastBall = new Vector3();
  private table: Table = generate();
  /** Where the bomb that went off this step was, so the bricks it clears fly away from it. */
  private blastAt: { x: number; y: number } | null = null;
  private bumperPulse = [0, 0];
  private goalPulse = 0;
  private landedAt = -1;
  private phaseAge = 0;
  private raised = false;
  /**
   * A press seen since the last step. A tap can go down and up between two
   * frames; without this the table would never see it.
   */
  private pressed = false;
  private frame = 0;
  private active = false;
  private lastFrame = 0;
  private time = 0;

  constructor(
    private mount: HTMLElement,
    private animate: boolean,
    private report: (state: PinballState) => void,
  ) {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    const { renderer, scene } = this;
    renderer.setClearColor(0x000000, 0);
    // Keeps the page's coral and ink close to themselves under bright light.
    renderer.toneMapping = NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.className = 'absolute inset-0 h-full w-full';
    canvas.style.maskImage = EDGE_FADE;
    canvas.setAttribute('aria-hidden', 'true');
    mount.append(canvas);

    // What the chrome reflects.
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    scene.environment = this.environment;

    const { sun } = this;
    sun.position.copy(SUN);
    sun.target.position.set(0, 0, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.6;
    Object.assign(sun.shadow.camera, {
      left: -330,
      right: 330,
      top: 330,
      bottom: -330,
      near: 300,
      far: 1500,
    });
    scene.add(sun, sun.target);

    this.models = new PinballModels(renderer.capabilities.getMaxAnisotropy());
    const { models, table } = this;
    this.field = new BrickField(models, animate);
    scene.add(models.table(table), this.field.group);
    for (const flipper of table.flippers) {
      const model = models.flipper();
      model.position.copy(onTable(flipper.pivot.x, flipper.pivot.y));
      this.flippers.push(model);
      scene.add(model);
    }
    for (const bumper of table.bumpers) {
      const model = models.bumper(bumper.radius);
      this.bumpers.push(model);
      scene.add(model.group);
    }
    const goal = models.goal(table.goal.radius);
    goal.group.position.copy(onTable(table.goal.x, table.goal.y));
    this.goalRing = goal.ring;
    scene.add(goal.group);

    this.marker = new Mesh(
      models.ringShape,
      new MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }),
    );
    this.marker.renderOrder = 1;
    scene.add(this.marker);

    this.ball = models.ball();
    this.ballShadow = models.ballBlob();
    scene.add(this.ball, this.ballShadow);
    for (let i = 0; i < GHOSTS; i++) {
      const ghost = new Mesh(models.sphere, models.ghost);
      ghost.visible = false;
      this.ghosts.push(ghost);
      scene.add(ghost);
    }

    for (let i = 0; i < RINGS; i++) {
      const mesh = new Mesh(
        models.ringShape,
        new MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }),
      );
      mesh.visible = false;
      mesh.renderOrder = 1;
      this.rings.push({ mesh, age: 0, life: 0, from: 0, to: 0, strength: 0 });
      scene.add(mesh);
    }

    this.camera.position.set(0, Math.sin(ELEVATION), Math.cos(ELEVATION)).multiplyScalar(DISTANCE);
    // A little toward the flippers: the near end is drawn larger, and a camera
    // aimed at the middle of the table would leave it sitting low in the view.
    this.camera.lookAt(0, 0, 28);
    this.deal();
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
    const light = this.models.setTones(tones);
    this.models.paint(this.table);
    this.accent.set(tones.accent);
    this.ink.set(tones.ink);
    this.marker.material.color.copy(this.accent);
    this.field.recolour();
    // A pale table needs less light to read, and its shadows are what give it depth.
    this.sun.intensity = light ? 1.7 : 3;
    this.scene.environmentIntensity = 0.6;
    this.render();
  }

  resize() {
    const { width, height } = this.mount.getBoundingClientRect();
    if (!width || !height) {
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    const { camera } = this;
    camera.aspect = width / height;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    // Zoom until the corner of the table that reaches furthest across the view
    // sits just inside it.
    let reach = 0;
    const corner = new Vector3();
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) {
        for (const y of [-DECK, BRICK_TALL]) {
          corner.set((x * WIDTH) / 2, y, (z * HEIGHT) / 2).project(camera);
          reach = Math.max(reach, Math.abs(corner.x), Math.abs(corner.y));
        }
      }
    }
    camera.zoom = FILL / reach;
    camera.updateProjectionMatrix();
    this.render();
  }

  setActive(active: boolean) {
    cancelAnimationFrame(this.frame);
    this.active = active;
    this.raised = false;
    this.pressed = false;
    if (!active) {
      return;
    }
    this.lastFrame = performance.now();
    this.render();
    if (this.animate) {
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  /** Raises every flipper, or lets them all drop. */
  setRaised(raised: boolean) {
    this.raised = raised && this.active;
    this.pressed ||= this.raised;
  }

  /** Throws the table away and deals a new one. */
  restart() {
    this.deal();
    this.models.paint(this.table);
    this.render();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.active = false;
    this.models.dispose();
    this.field.dispose();
    for (const ring of [...this.rings.map(({ mesh }) => mesh), this.marker]) {
      ring.material.dispose();
    }
    this.environment.dispose();
    this.sun.dispose();
    this.renderer.dispose();
    // Hand the GL context back now rather than whenever the canvas is collected;
    // browsers cap how many can be alive at once.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private tell() {
    const { balls, phase, held } = this.table;
    this.report({ balls, phase, ready: held && phase === 'play' });
  }

  private deal() {
    // The walls, flippers and goal never move; only the bricks and bumpers are dealt anew.
    this.table = generate();
    this.phaseAge = 0;
    this.landedAt = -1;
    this.bumperPulse = [0, 0];
    this.goalPulse = 0;
    for (const ring of this.rings) {
      ring.mesh.visible = false;
    }

    const { table } = this;
    this.field.deal(table);
    for (const [index, bumper] of table.bumpers.entries()) {
      this.bumpers[index].group.position.copy(onTable(bumper.x, bumper.y));
    }
    this.lastBall.copy(onTable(table.ball.x, table.ball.y, BALL_RADIUS));
    this.tell();
  }

  private openRing(
    at: Point,
    color: Color,
    from: number,
    to: number,
    life: number,
    strength: number,
  ) {
    const ring = this.rings.find((candidate) => !candidate.mesh.visible) ?? this.rings[0];
    Object.assign(ring, { age: 0, life, from, to, strength });
    ring.mesh.position.copy(onTable(at.x, at.y, 1));
    ring.mesh.material.color.copy(color);
    ring.mesh.visible = true;
  }

  private react(event: TableEvent) {
    const { models, field } = this;
    if (event.type === 'break') {
      const { blastAt } = this;
      if (blastAt) {
        const away = Math.hypot(event.brick.x - blastAt.x, event.brick.y - blastAt.y) || 1;
        const push = 700 * (1 - away / (BLAST * 1.5));
        field.breakOut(event.brick, {
          x: ((event.brick.x - blastAt.x) / away) * push,
          y: ((event.brick.y - blastAt.y) / away) * push,
        });
      } else {
        field.breakOut(event.brick, { x: this.table.ball.vx * 1.3, y: this.table.ball.vy * 1.3 });
      }
    } else if (event.type === 'bomb') {
      this.blastAt = event.brick;
      field.breakOut(event.brick, { x: 0, y: 0 }, 0);
      field.spray(event.brick, models.accentTone, 26, 320);
      this.openRing(event.brick, this.accent, 6, BLAST * 1.4, 0.5, 0.95);
    } else if (event.type === 'hazard') {
      field.breakOut(event.brick, { x: this.table.ball.vx, y: this.table.ball.vy });
      field.spray(event.at, models.ballMaterial.color, 14, 260);
      this.openRing(event.at, this.ink, 4, 36, 0.45, 0.6);
      this.tell();
    } else if (event.type === 'bumper') {
      this.bumperPulse[event.bumper.id] = 1;
      this.openRing(
        event.bumper,
        this.accent,
        event.bumper.radius,
        event.bumper.radius + 18,
        0.32,
        0.6,
      );
    } else if (event.type === 'drop') {
      this.tell();
    } else if (event.type === 'serve') {
      this.landedAt = this.time;
    } else if (event.type === 'drain') {
      this.openRing({ x: event.at.x, y: HEIGHT - 8 }, this.ink, 4, 40, 0.5, 0.5);
      this.tell();
    } else if (event.type === 'goal') {
      this.goalPulse = 1;
      field.celebrate();
      this.openRing(event.at, this.accent, 14, 130, 0.9, 0.9);
      this.openRing(event.at, this.accent, 8, 80, 0.6, 0.7);
      this.phaseAge = 0;
      this.tell();
    }
  }

  private tick = (now: number) => {
    if (!this.active) {
      return;
    }
    const elapsed = now - this.lastFrame;
    const waiting =
      this.table.held &&
      this.table.phase === 'play' &&
      !this.raised &&
      !this.pressed &&
      !this.field.busy &&
      !this.rings.some((ring) => ring.mesh.visible);
    if (!waiting || elapsed >= IDLE_FRAME_MS - 1) {
      this.lastFrame = now;
      this.step(Math.min(0.05, elapsed / 1000));
      this.render();
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private step(dt: number) {
    this.time += dt;
    const { table } = this;

    if (table.phase === 'play') {
      this.blastAt = null;
      const raised = this.raised || this.pressed;
      this.pressed = false;
      for (const event of advance(table, dt, raised)) {
        this.react(event);
      }
    } else {
      this.phaseAge += dt;
      const stay = table.phase === 'won' ? WON_SECONDS : LOST_SECONDS;
      if (this.phaseAge >= stay + LEAVE_SECONDS) {
        this.deal();
        this.models.paint(this.table);
      }
    }

    for (const [index, pulse] of this.bumperPulse.entries()) {
      this.bumperPulse[index] = Math.max(0, pulse - dt * 4);
    }
    this.goalPulse = Math.max(0, this.goalPulse - dt * 1.2);
    this.field.step(dt, table.goal);
    for (const ring of this.rings) {
      if (!ring.mesh.visible) {
        continue;
      }
      ring.age += dt;
      const t = clamp01(ring.age / ring.life);
      ring.mesh.scale.setScalar(ring.from + (ring.to - ring.from) * (1 - (1 - t) ** 3));
      ring.mesh.material.opacity = ring.strength * (1 - t) ** 2;
      ring.mesh.visible = t < 1;
    }
  }

  /** How high the ball is above the table: dropping in, then a couple of settling hops. */
  private ballLift() {
    const { ball } = this.table;
    if (ball.wait > 0) {
      return DROP_HEIGHT * (ball.wait / SERVE_SECONDS) ** 2;
    }
    const since = this.time - this.landedAt;
    if (this.landedAt < 0 || since > 0.6) {
      return 0;
    }
    return 10 * Math.abs(Math.sin(since * 14)) * Math.exp(-since * 7);
  }

  private place() {
    const { table, models } = this;
    const over = table.phase !== 'play';
    const won = table.phase === 'won';
    const stay = won ? WON_SECONDS : LOST_SECONDS;
    const leaving = over ? 1 - clamp01((this.phaseAge - stay) / LEAVE_SECONDS) : 1;

    this.field.place(leaving);

    for (const [index, flipper] of table.flippers.entries()) {
      this.flippers[index].rotation.y = -flipper.angle;
    }
    for (const [index, { group, cap }] of this.bumpers.entries()) {
      const pulse = this.bumperPulse[index];
      group.scale.set(1 + 0.16 * pulse, 1 - 0.12 * pulse, 1 + 0.16 * pulse);
      cap.emissiveIntensity = 0.15 + 1.6 * pulse;
    }
    models.bomb.emissiveIntensity = 0.2 + 0.14 * Math.sin(this.time * 4);
    models.glow.emissiveIntensity = 0.55 + 0.2 * Math.sin(this.time * 3) + 2.5 * this.goalPulse;
    this.goalRing.scale.setScalar((table.goal.radius + 1.5) * (1 + 0.25 * this.goalPulse));

    const { ball } = table;
    const waiting = table.held && table.phase === 'play';
    this.marker.visible = waiting;
    if (waiting) {
      const beat = 0.5 + 0.5 * Math.sin(this.time * 4);
      this.marker.position.copy(onTable(ball.x, ball.y, 0.8));
      this.marker.scale.setScalar(BALL_RADIUS * (1.25 + 0.35 * beat));
      this.marker.material.opacity = 0.45 + 0.4 * beat;
    }
    const sunk = won ? 1 - clamp01(this.phaseAge / 0.35) : 1;
    const shown = table.phase !== 'lost' && !table.held && sunk > 0;
    const lift = this.ballLift();
    const position = onTable(ball.x, ball.y, BALL_RADIUS * sunk + lift);
    this.ball.visible = shown;
    this.ball.position.copy(position);
    this.ball.scale.setScalar(BALL_RADIUS * sunk);
    const high = clamp01(lift / DROP_HEIGHT);
    this.ballShadow.visible = shown;
    this.ballShadow.position.copy(onTable(ball.x, ball.y, 0.4));
    this.ballShadow.scale.setScalar(BALL_RADIUS * (1.3 + 1.2 * high));

    // A fast ball leaves faint copies of itself along the way it came this frame.
    const travelled = position.distanceTo(this.lastBall);
    const blur = shown && lift === 0 ? clamp01((travelled - BALL_RADIUS) / (BALL_RADIUS * 3)) : 0;
    models.ghost.opacity = 0.28 * blur;
    for (const [index, ghost] of this.ghosts.entries()) {
      const back = (index + 1) / (GHOSTS + 1);
      ghost.visible = blur > 0;
      ghost.position.lerpVectors(position, this.lastBall, back);
      ghost.scale.setScalar(BALL_RADIUS * (1 - back * 0.35));
    }
    this.lastBall.copy(position);
  }

  private render() {
    this.place();
    this.renderer.render(this.scene, this.camera);
  }
}
