import {
  type Group,
  InstancedMesh,
  Mesh,
  Object3D,
  OrthographicCamera,
  RingGeometry,
  Scene,
  type ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';

import { RockfallFloor } from './rockfallFloor';
import { RockfallModels } from './rockfallModels';
import { type Body, GRAVITY, type Impact, Rubble, bodyAt } from './rockfallRubble';
import { Shards } from './rockfallShards';
import {
  BLAST_RADIUS,
  type Cell,
  type Point,
  RAT,
  SIZE,
  type World,
  blast,
  blocks,
  generate,
  trace,
} from './rockfallWorld';

export type RockfallState = {
  rats: number;
  total: number;
  shots: number;
  phase: 'play' | 'won' | 'lost';
};

type BlockView = Body & {
  home: Vector3;
  /** `loose` moves as rubble; `fading` still does, while it shrinks away. */
  mode: 'rising' | 'still' | 'loose' | 'fading' | 'gone';
  /** Seconds in the current mode; negative while it waits its turn. */
  age: number;
  /** Its size when it began to fade. */
  full: number;
  /** Already drawn where it stands, and not moved since. */
  drawn: boolean;
};

type RatView = {
  model: Group;
  shadow: Mesh;
  home: Vector3;
  position: Vector3;
  velocity: Vector3;
  facing: number;
  tumble: number;
  spin: number;
  scale: number;
  /** `riding` goes down with its ground; `doomed` waits for a fall to reach it. */
  mode: 'rising' | 'still' | 'riding' | 'doomed' | 'flying' | 'gone';
  age: number;
  drop: number;
};

type Shot = { ball: Mesh; from: Vector3; to: Vector3; centre: Point; age: number };

type Ring = {
  mesh: Mesh;
  glass: ShaderMaterial;
  age: number;
  seconds: number;
  reach: number;
  strength: number;
};

const MAX_BLOCKS = 6000;
/**
 * Of the blocks a blast destroys, how many fly out as rubble and how many burst
 * into dust; the rest are simply gone.
 */
const CHUNKS = { share: 0.42, most: 80, dust: 0.45 };
/** Of the blocks of a piece that lands hard, how many burst into dust where they hit. */
const CRUMBLE = 0.35;
const MAX_RATS = 16;
const MAX_SHOTS = 4;
const RISE_SECONDS = 0.35;
const SHOT_SECONDS = 0.28;
const FLASH_SECONDS = 0.32;
const CORE_SECONDS = 0.14;
/** The blast holds everything nearly still for a moment before it all flies. */
const STALL = { seconds: 0.07, pace: 0.08 };
/** How far the view shakes, in blocks, and how quickly that dies away, per second. */
const SHAKE = { blast: 0.42 * RAT, landing: 0.012 * RAT, most: 0.5 * RAT, decay: 9 };
/** How far the view leans in at a blast, as a share of its size. */
const PUNCH = { blast: 0.04, decay: 8 };
/** The glow left round a blast: how long, and how far out from its middle. */
const BURN = { seconds: 0.9, reach: BLAST_RADIUS + 0.7 * RAT };
const RINGS = [
  { delay: 0, seconds: 0.42, reach: 3.2, strength: 0.85 },
  { delay: 0.06, seconds: 0.7, reach: 4.8, strength: 0.35 },
];
/** Rubble already lying near a blast is thrown again, out to this many blast radii. */
const BLOWBACK = 2.4;
const RAT_SECONDS = 1.1;
/** A block blown out by a blast shrinks to this as it leaves. */
const CHUNK_SIZE = 0.8;
/** How long rubble lies still before it goes, and the longest it is given to get there. */
const REST_SECONDS = 0.45;
const LOOSE_SECONDS = 4;
const FADE_SECONDS = 0.5;
/** How long loose rubble holds up the verdict on a round. */
const SETTLE_SECONDS = 1.1;
/** Rubble that rolls this far from the middle is past the floor's fade. */
const EDGE = 11 * RAT;
/** How long the target takes to appear, and how quickly it follows the pointer, per second. */
const AIM_SECONDS = 0.14;
const AIM_FOLLOW = 24;
/** How long the result stays up before the map is cleared away. */
const WON_SECONDS = 1.7;
const LOST_SECONDS = 1.5;
const LEAVE_SECONDS = 0.3;
const IDLE_FRAME_MS = 1000 / 30;
/** The whole map with room for debris, in blocks, as the view has to fit it. */
const VIEW = { width: 15 * RAT, height: 14.5 * RAT };
/** A rat's shadow, in blocks: longer along the rat than across it. */
const SHADOW = { across: 0.38, along: 0.56 };
/** Clear of the block's top face, which is at the same height. */
const SHADOW_LIFT = 0.03;
const TOWARD_EYE = new Vector3(1, 1, 1).normalize();
const LOOK_AT = new Vector3(0, 2.4 * RAT, 0);
const EYE_DISTANCE = 50 * RAT;
/** Across and up the screen, in the scene, for shaking the view. */
const SCREEN_RIGHT = new Vector3(1, 0, -1).normalize();
const SCREEN_UP = new Vector3(-1, 2, -1).normalize();
/** A soft edge all round, so debris leaving the view dissolves instead of being cut. */
const EDGE_FADE = 'radial-gradient(ellipse closest-side, #000 76%, transparent)';

const between = (low: number, high: number) => low + Math.random() * (high - low);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
/** Past the end and back, for things that pop into place. */
const overshoot = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
const cellKey = (cell: Cell) => cell.x + SIZE * (cell.z + SIZE * cell.y);
/** Block coordinates have the map's corner at the origin; the scene has its middle there. */
const toScene = (x: number, y: number, z: number) => new Vector3(x - SIZE / 2, y, z - SIZE / 2);

export class RockfallGame {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private readonly models = new RockfallModels();
  private readonly floor = new RockfallFloor();
  private readonly rubble = new Rubble();
  private readonly shards: Shards;
  private readonly impacts: Impact<BlockView>[] = [];
  private readonly mesh: InstancedMesh;
  private readonly rats: Group[] = [];
  private readonly shadows: Mesh[] = [];
  private readonly ballGeometry = new SphereGeometry(1, 48, 32);
  private readonly aimGlass: ShaderMaterial;
  private readonly flashGlass: ShaderMaterial;
  private readonly coreGlass: ShaderMaterial;
  private readonly aim: Mesh;
  private readonly flash: Mesh;
  private readonly core: Mesh;
  private readonly ringGeometry = new RingGeometry(0.9, 1, 96).rotateX(-Math.PI / 2);
  private readonly rings: Ring[] = [];
  private readonly balls: Mesh[] = [];
  private readonly pose = new Object3D();
  private world: World = generate();
  private blockViews: BlockView[] = [];
  private blockAt = new Map<number, BlockView>();
  private ratViews = new Map<number, RatView>();
  private shots: Shot[] = [];
  private phase: RockfallState['phase'] = 'play';
  private phaseAge = 0;
  private flashAge = FLASH_SECONDS;
  private burnAge = BURN.seconds;
  private readonly burnAt = new Vector3();
  private shake = 0;
  private punch = 0;
  private stall = 0;
  /** Where the pointer is, and the middle of the blast a shot there would make. */
  private pointer: { x: number; y: number } | null = null;
  private aimTarget: Vector3 | null = null;
  private aimShown = 0;
  private width = 1;
  private height = 1;
  private frame = 0;
  private active = false;
  private lastFrame = 0;
  private time = 0;

  constructor(
    private mount: HTMLElement,
    private animate: boolean,
    private report: (state: RockfallState) => void,
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

    this.mesh = new InstancedMesh(this.models.block, this.models.stone, MAX_BLOCKS);
    // Its bounds are worked out once, from the first map; the map changes.
    this.mesh.frustumCulled = false;
    this.scene.add(this.floor.group, this.mesh);
    for (let i = 0; i < MAX_RATS; i++) {
      const rat = this.models.rat();
      const shadow = this.floor.blob();
      rat.visible = false;
      shadow.visible = false;
      this.rats.push(rat);
      this.shadows.push(shadow);
      this.scene.add(rat, shadow);
    }
    for (let i = 0; i < MAX_SHOTS; i++) {
      const ball = new Mesh(this.ballGeometry, this.models.coral);
      ball.scale.setScalar(0.22 * RAT);
      ball.visible = false;
      this.balls.push(ball);
      this.scene.add(ball);
    }
    this.shards = new Shards(this.models.block, this.models.dust, this.models.coral);
    this.scene.add(...this.shards.meshes);
    this.aimGlass = this.models.bubble(0.05);
    this.flashGlass = this.models.bubble(0.4);
    this.coreGlass = this.models.bubble(1);
    this.aim = new Mesh(this.ballGeometry, this.aimGlass);
    this.flash = new Mesh(this.ballGeometry, this.flashGlass);
    this.core = new Mesh(this.ballGeometry, this.coreGlass);
    for (const sphere of [this.aim, this.flash, this.core]) {
      sphere.visible = false;
      // Over the floor and the shadows, which are see-through as well.
      sphere.renderOrder = 2;
      this.scene.add(sphere);
    }
    for (const { strength } of RINGS) {
      const glass = this.models.bubble(1);
      const mesh = new Mesh(this.ringGeometry, glass);
      mesh.visible = false;
      mesh.renderOrder = 3;
      this.rings.push({ mesh, glass, age: 0, seconds: 1, reach: 1, strength });
      this.scene.add(mesh);
    }

    this.camera.near = 1;
    this.camera.far = EYE_DISTANCE * 2.4;
    this.camera.position.copy(LOOK_AT).addScaledVector(TOWARD_EYE, EYE_DISTANCE);
    this.camera.lookAt(LOOK_AT);
    this.build();
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
    this.models.setTones(tones);
    this.floor.setTones(tones);
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
    const pixelsPerBlock = Math.min(width / VIEW.width, height / VIEW.height);
    this.camera.left = -width / 2 / pixelsPerBlock;
    this.camera.right = width / 2 / pixelsPerBlock;
    this.camera.top = height / 2 / pixelsPerBlock;
    this.camera.bottom = -height / 2 / pixelsPerBlock;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.render();
  }

  setActive(active: boolean) {
    cancelAnimationFrame(this.frame);
    this.active = active;
    this.pointer = null;
    this.aimTarget = null;
    this.aimShown = 0;
    this.showAim();
    if (!active) {
      return;
    }
    this.lastFrame = performance.now();
    this.render();
    if (this.animate) {
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  aimAt(clientX: number, clientY: number) {
    this.pointer = { x: clientX, y: clientY };
    this.retarget();
  }

  clearAim() {
    this.pointer = null;
    this.retarget();
  }

  /** Fires at a point on screen, or at a rat of its own choosing without one. */
  fire(client: { x: number; y: number } | null) {
    if (!this.active) {
      return;
    }
    if (this.phase !== 'play') {
      // Without motion nothing clears the finished map away, so the next press does.
      if (!this.animate) {
        this.restart();
      }
      return;
    }
    if (!this.canFire()) {
      return;
    }
    const rat = this.world.rats[Math.floor(Math.random() * this.world.rats.length)];
    const centre = client
      ? this.pick(client.x, client.y)
      : rat && { x: rat.x + 0.5, y: rat.y - 0.5 * RAT, z: rat.z + 0.5 };
    const ball = this.balls.find((candidate) => !candidate.visible);
    if (!centre || !ball) {
      return;
    }
    if (!this.animate) {
      this.resolve(centre);
      this.settle();
      this.render();
      return;
    }
    const to = toScene(centre.x, centre.y, centre.z);
    // It comes in from above and in front, the way the view looks at the map.
    const from = to.clone().add(new Vector3(3.5, 11, 3.5).multiplyScalar(RAT));
    ball.position.copy(from);
    ball.visible = true;
    this.shots.push({ ball, from, to, centre, age: 0 });
    this.retarget();
    this.tell();
  }

  /** Throws the map away and deals a new one. */
  restart() {
    this.build();
    this.render();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.active = false;
    this.models.dispose();
    this.floor.dispose();
    this.ballGeometry.dispose();
    this.ringGeometry.dispose();
    this.aimGlass.dispose();
    this.flashGlass.dispose();
    this.coreGlass.dispose();
    for (const ring of this.rings) {
      ring.glass.dispose();
    }
    this.shards.dispose();
    this.mesh.dispose();
    this.renderer.dispose();
    // Hand the GL context back now rather than whenever the canvas is collected;
    // browsers cap how many can be alive at once.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private canFire() {
    return this.phase === 'play' && this.world.shots - this.shots.length > 0;
  }

  private tell() {
    this.report({
      rats: this.world.rats.length,
      total: this.world.total,
      shots: this.world.shots - this.shots.length,
      phase: this.phase,
    });
  }

  /** Works out what the pointer is aiming at now: the map under it may have changed. */
  private retarget() {
    const centre =
      this.pointer && this.canFire() ? this.pick(this.pointer.x, this.pointer.y) : null;
    this.aimTarget = centre && toScene(centre.x, centre.y, centre.z);
    if (!this.animate) {
      this.aimShown = this.aimTarget ? 1 : 0;
      this.showAim();
      this.render();
    }
  }

  private showAim() {
    const shown = smooth(this.aimShown);
    if (this.aimTarget && (!this.animate || !this.aim.visible)) {
      this.aim.position.copy(this.aimTarget);
    }
    this.aim.visible = shown > 0;
    this.aimGlass.uniforms.uOpacity.value = 0.9 * shown;
    const pulse = this.animate ? 1 + 0.02 * Math.sin(this.time * 4) : 1;
    this.aim.scale.setScalar(BLAST_RADIUS * (0.85 + 0.15 * shown) * pulse);
    this.models.markAim(this.aimTarget, BLAST_RADIUS, shown);
  }

  private build() {
    this.world = generate();
    this.phase = 'play';
    this.phaseAge = 0;
    this.shots = [];
    for (const ball of this.balls) {
      ball.visible = false;
    }
    for (const mesh of [this.flash, this.core, ...this.rings.map((ring) => ring.mesh)]) {
      mesh.visible = false;
    }
    this.shards.clear();
    this.burnAge = BURN.seconds;
    this.models.markBurn(this.burnAt, BURN.reach, 0);
    this.stall = 0;

    this.blockViews = [];
    this.blockAt = new Map();
    for (const cell of blocks(this.world).slice(0, MAX_BLOCKS)) {
      const home = toScene(cell.x + 0.5, cell.y + 0.5, cell.z + 0.5);
      const view: BlockView = {
        ...bodyAt(home.clone()),
        home,
        size: this.animate ? 0 : 1,
        mode: this.animate ? 'rising' : 'still',
        // The map builds itself from the far corner forward and from the ground up.
        age: -((cell.x + cell.z) * 0.018 + cell.y * 0.05) / RAT,
        full: 1,
        drawn: false,
      };
      this.blockViews.push(view);
      this.blockAt.set(cellKey(cell), view);
    }
    this.mesh.count = this.blockViews.length;

    this.ratViews = new Map();
    for (const model of [...this.rats, ...this.shadows]) {
      model.visible = false;
    }
    for (const rat of this.world.rats.slice(0, MAX_RATS)) {
      const home = toScene(rat.x + 0.5, rat.y, rat.z + 0.5);
      this.ratViews.set(rat.id, {
        model: this.rats[rat.id],
        shadow: this.shadows[rat.id],
        home,
        position: home.clone(),
        velocity: new Vector3(),
        facing: Math.PI / 4 + between(-0.7, 0.7),
        tumble: 0,
        spin: 0,
        scale: this.animate ? 0 : 1,
        mode: this.animate ? 'rising' : 'still',
        age: -(0.5 + rat.id * 0.04),
        drop: 0,
      });
    }
    this.retarget();
    this.tell();
  }

  /** The point a click at these screen coordinates would blast, in block coordinates. */
  private pick(clientX: number, clientY: number): Point | null {
    const field = this.mount.getBoundingClientRect();
    const eye = new Vector3(
      ((clientX - field.left) / this.width) * 2 - 1,
      1 - ((clientY - field.top) / this.height) * 2,
      -1,
    ).unproject(this.camera);
    const origin = { x: eye.x + SIZE / 2, y: eye.y, z: eye.z + SIZE / 2 };
    const direction = { x: -TOWARD_EYE.x, y: -TOWARD_EYE.y, z: -TOWARD_EYE.z };
    const hit = trace(this.world, origin, direction);
    // A little way into the ground, so the blast takes a bite out of it.
    const depth = 0.35 * RAT;
    return (
      hit && {
        x: hit.point.x + direction.x * depth,
        y: hit.point.y + direction.y * depth,
        z: hit.point.z + direction.z * depth,
      }
    );
  }

  /**
   * Hands a standing block over to the rubble's physics, where it stands. A chunk
   * blown out by a blast is smaller than a block; a block of a falling piece goes
   * down with it until something breaks the piece up.
   */
  private loosen(view: BlockView, chunk: boolean) {
    view.mode = 'loose';
    view.age = 0;
    view.size = chunk ? CHUNK_SIZE : 1;
    view.rest = 0;
    view.intact = !chunk;
    view.velocity.set(0, 0, 0);
    view.spin.set(0, 0, 0);
  }

  /** Applies one blast to the world and sets everything it loosened in motion. */
  private resolve(centre: Point) {
    const outcome = blast(this.world, centre);
    const middle = toScene(centre.x, centre.y, centre.z);

    // Already lying rubble nearby is thrown again, before the blast adds its own.
    if (this.animate) {
      for (const view of this.blockViews) {
        if (view.mode === 'loose' || view.mode === 'fading') {
          this.blow(view, middle, BLAST_RADIUS * BLOWBACK, 1);
        }
      }
    }
    let chunks = 0;
    for (const cell of outcome.blasted) {
      const view = this.blockAt.get(cellKey(cell));
      if (!view) {
        continue;
      }
      if (chunks >= CHUNKS.most || Math.random() > CHUNKS.share) {
        view.mode = 'gone';
        if (this.animate && Math.random() < CHUNKS.dust) {
          const away = view.home.clone().sub(middle);
          const close = 1 - Math.min(1, away.length() / BLAST_RADIUS);
          away.normalize().multiplyScalar((4 + 6 * close + between(0, 3)) * RAT);
          away.y += between(2, 6) * RAT;
          this.shards.throw('dust', view.home, away, between(0.3, 0.6), between(0.5, 1));
        }
        continue;
      }
      chunks++;
      this.loosen(view, true);
      this.blow(view, middle, BLAST_RADIUS + 1, 1.6);
    }
    for (const fall of outcome.falls) {
      for (const cell of fall.cells) {
        const view = this.blockAt.get(cellKey(cell));
        if (view) {
          this.loosen(view, false);
          // What hung nearest the blast is pushed off the rest, so a piece cut
          // loose by a near miss tips as it goes rather than dropping square.
          if (this.animate && view.home.distanceTo(middle) < BLAST_RADIUS * 2) {
            this.blow(view, middle, BLAST_RADIUS * 2, 0.4);
            view.intact = false;
          }
        }
      }
    }
    for (const { rat, cause, fall, gap } of outcome.downed) {
      const view = this.ratViews.get(rat.id);
      if (!view) {
        continue;
      }
      view.spin = between(6, 12) * (Math.random() < 0.5 ? -1 : 1);
      view.age = 0;
      const piece = fall === undefined ? undefined : outcome.falls[fall];
      if (cause === 'fall' && piece) {
        view.mode = 'riding';
        // Its own block stops at the floor even where the rest of the piece does not.
        view.drop = Math.min(piece.drop, view.home.y - 1);
      } else if (cause === 'crush' && piece) {
        // It stays put until the piece above has fallen far enough to reach it.
        view.mode = 'doomed';
        view.age = -Math.sqrt((2 * Math.max(0, (gap ?? 0) - 0.6 * RAT)) / GRAVITY);
      } else {
        const away = view.home.clone().sub(middle).setY(0).normalize();
        const thrown = cause === 'blast' ? between(4, 7) : between(0.3, 1);
        view.mode = 'flying';
        view.velocity.copy(away.multiplyScalar(thrown * RAT));
        view.velocity.y = (cause === 'blast' ? between(7, 10) : 1.5) * RAT;
        if (cause === 'blast') {
          view.spin *= 1.6;
        }
      }
    }

    if (this.animate) {
      this.boom(middle);
    }
    this.retarget();
    this.tell();
  }

  /**
   * Sends a body flying away from `middle`: hardest at the middle and nothing by
   * `reach`. `force` scales it; a whole piece takes less, or it would fly apart.
   */
  private blow(view: BlockView, middle: Vector3, reach: number, force: number) {
    const away = view.position.clone().sub(middle);
    const close = 1 - away.length() / reach;
    if (close <= 0) {
      return;
    }
    away.normalize();
    const speed = (2.5 + 6 * close + between(0, 1.5)) * RAT * force;
    view.velocity.addScaledVector(away, speed);
    view.velocity.y += (1.5 + 3.5 * close) * RAT * force;
    view.spin.x += between(-1, 1) * 14 * close * force;
    view.spin.y += between(-1, 1) * 6 * close * force;
    view.spin.z += between(-1, 1) * 14 * close * force;
    view.rest = 0;
  }

  private boom(middle: Vector3) {
    this.flash.position.copy(middle);
    this.core.position.copy(middle);
    this.flash.visible = true;
    this.core.visible = true;
    this.flashAge = 0;
    for (const [index, ring] of this.rings.entries()) {
      const { delay, seconds, reach } = RINGS[index];
      ring.mesh.position.copy(middle);
      ring.age = -delay;
      ring.seconds = seconds;
      ring.reach = reach;
      ring.mesh.visible = true;
    }
    this.burnAt.copy(middle);
    this.burnAge = 0;
    this.stall = STALL.seconds;
    this.shake = Math.max(this.shake, SHAKE.blast);
    this.punch = PUNCH.blast;
    const velocity = new Vector3();
    const from = new Vector3();
    for (let i = 0; i < 34; i++) {
      velocity
        .set(between(-1, 1), between(0.2, 1.2), between(-1, 1))
        .normalize()
        .multiplyScalar(between(5, 13) * RAT);
      from.copy(middle).addScaledVector(velocity, 0.02);
      this.shards.throw('spark', from, velocity, between(0.14, 0.32), between(0.35, 0.8));
    }
  }

  /** A piece that came down whole meets the ground: some of it bursts, and the view shakes. */
  private land(impacts: Impact<BlockView>[]) {
    this.shake = Math.min(SHAKE.most, this.shake + impacts.length * SHAKE.landing);
    const velocity = new Vector3();
    for (const { body, speed } of impacts) {
      if (Math.random() >= CRUMBLE) {
        continue;
      }
      body.mode = 'gone';
      for (let i = 0; i < 2; i++) {
        velocity
          .set(between(-1, 1), between(0.3, 1), between(-1, 1))
          .multiplyScalar(speed * between(0.15, 0.35));
        this.shards.throw('dust', body.position, velocity, between(0.3, 0.55), between(0.4, 0.8));
      }
    }
  }

  /** Without motion: everything a blast loosened is simply gone. */
  private settle() {
    for (const view of this.blockViews) {
      if (view.mode !== 'still') {
        view.mode = 'gone';
      }
    }
    for (const view of this.ratViews.values()) {
      if (view.mode !== 'still') {
        view.mode = 'gone';
      }
    }
    this.judge();
  }

  private moving() {
    return (
      this.blockViews.some((view) => view.mode === 'loose' && view.age < SETTLE_SECONDS) ||
      [...this.ratViews.values()].some(
        (view) => view.mode === 'riding' || view.mode === 'doomed' || view.mode === 'flying',
      )
    );
  }

  /** Ends the round once it is decided: every rat down, or no shots left to try. */
  private judge() {
    if (this.phase !== 'play' || this.shots.length) {
      return;
    }
    if (this.world.rats.length === 0) {
      this.phase = 'won';
    } else if (this.world.shots === 0 && !this.moving()) {
      this.phase = 'lost';
    } else {
      return;
    }
    this.phaseAge = 0;
    this.retarget();
    this.tell();
  }

  private tick = (now: number) => {
    if (!this.active) {
      return;
    }
    const elapsed = now - this.lastFrame;
    const lively =
      this.shots.length > 0 ||
      this.phase !== 'play' ||
      this.aim.visible ||
      this.aimTarget !== null ||
      this.flash.visible ||
      this.shards.busy ||
      this.burnAge < BURN.seconds ||
      this.shake > 0.001 ||
      this.rings.some((ring) => ring.mesh.visible) ||
      this.moving() ||
      this.blockViews.some((view) => view.mode !== 'still' && view.mode !== 'gone');
    if (lively || elapsed >= IDLE_FRAME_MS - 1) {
      this.lastFrame = now;
      this.step(Math.min(0.05, elapsed / 1000));
      this.render();
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private step(frame: number) {
    // `frame` is time as it passes; `dt`, time as the scene lives it, which all
    // but stops for a moment as a blast goes off.
    const dt = this.stall > 0 ? frame * STALL.pace : frame;
    this.stall -= frame;
    this.time += dt;

    const landed: Shot[] = [];
    this.shots = this.shots.filter((shot) => {
      shot.age += dt;
      const t = clamp01(shot.age / SHOT_SECONDS);
      shot.ball.position.lerpVectors(shot.from, shot.to, t * t);
      if (t < 1) {
        return true;
      }
      shot.ball.visible = false;
      landed.push(shot);
      return false;
    });
    // Only once they are off the list: a shot still on it would be counted as in
    // the air and as spent, and the count would read one too few.
    for (const shot of landed) {
      this.resolve(shot.centre);
    }

    const rubble: BlockView[] = [];
    for (const view of this.blockViews) {
      view.age += dt;
      if (view.age < 0) {
        continue;
      }
      if (view.mode === 'rising') {
        const t = clamp01(view.age / RISE_SECONDS);
        view.size = overshoot(t);
        if (t >= 1) {
          view.mode = 'still';
        }
      } else if (view.mode === 'loose') {
        const strayed = Math.abs(view.position.x) > EDGE || Math.abs(view.position.z) > EDGE;
        if (view.rest >= REST_SECONDS || view.age >= LOOSE_SECONDS || strayed) {
          view.mode = 'fading';
          view.age = 0;
          view.full = view.size;
        }
        rubble.push(view);
      } else if (view.mode === 'fading') {
        // It keeps moving as it goes, so it shrinks down onto whatever it lies on.
        const t = view.age / FADE_SECONDS;
        view.size = view.full * (1 - smooth(t));
        if (t >= 1) {
          view.mode = 'gone';
        } else {
          rubble.push(view);
        }
      }
    }
    this.impacts.length = 0;
    this.rubble.simulate(this.world, rubble, dt, this.impacts);
    if (this.impacts.length) {
      this.land(this.impacts);
    }
    this.shards.step(this.world, dt);

    for (const view of this.ratViews.values()) {
      view.age += dt;
      if (view.age < 0) {
        continue;
      }
      if (view.mode === 'rising') {
        const t = clamp01(view.age / RISE_SECONDS);
        view.scale = overshoot(t);
        if (t >= 1) {
          view.mode = 'still';
        }
      } else if (view.mode === 'riding') {
        const fallen = 0.5 * GRAVITY * view.age ** 2;
        view.position.y = view.home.y - Math.min(fallen, view.drop);
        if (fallen >= view.drop) {
          view.mode = 'flying';
          view.age = 0;
          view.velocity.set(between(-2.5, 2.5), between(2, 5), between(-2.5, 2.5));
          view.velocity.multiplyScalar(RAT);
        }
      } else if (view.mode === 'doomed') {
        view.mode = 'flying';
        view.age = 0;
        view.velocity.set(between(-3, 3), between(1, 2.5), between(-3, 3));
        view.velocity.multiplyScalar(RAT);
      } else if (view.mode === 'flying') {
        view.velocity.y -= GRAVITY * dt;
        view.position.addScaledVector(view.velocity, dt);
        view.tumble += view.spin * dt;
        view.scale = 1 - smooth((view.age - 0.5) / (RAT_SECONDS - 0.5));
        if (view.age >= RAT_SECONDS) {
          view.mode = 'gone';
        }
      }
    }

    if (this.flash.visible) {
      this.flashAge += frame;
      const t = clamp01(this.flashAge / FLASH_SECONDS);
      this.flash.scale.setScalar(BLAST_RADIUS * (0.3 + 1.2 * (1 - (1 - t) ** 4)));
      this.flashGlass.uniforms.uOpacity.value = 0.9 * (1 - t) ** 2;
      this.flash.visible = t < 1;
      const c = clamp01(this.flashAge / CORE_SECONDS);
      this.core.scale.setScalar(BLAST_RADIUS * (0.25 + 0.5 * (1 - (1 - c) ** 2)));
      this.coreGlass.uniforms.uOpacity.value = (1 - c) ** 1.5;
      this.core.visible = c < 1;
    }
    for (const ring of this.rings) {
      if (!ring.mesh.visible) {
        continue;
      }
      ring.age += frame;
      const t = clamp01(ring.age / ring.seconds);
      ring.mesh.scale.setScalar(BLAST_RADIUS * (0.4 + ring.reach * (1 - (1 - t) ** 3)));
      ring.glass.uniforms.uOpacity.value = ring.age < 0 ? 0 : ring.strength * (1 - t) ** 2;
      ring.mesh.visible = t < 1;
    }
    if (this.burnAge < BURN.seconds) {
      this.burnAge += frame;
      const left = 1 - clamp01(this.burnAge / BURN.seconds);
      this.models.markBurn(this.burnAt, BURN.reach, left * left);
    }
    this.shake *= Math.exp(-SHAKE.decay * frame);
    this.punch *= Math.exp(-PUNCH.decay * frame);

    if (this.aimTarget && this.aim.visible) {
      this.aim.position.lerp(this.aimTarget, 1 - Math.exp(-AIM_FOLLOW * frame));
    }
    this.aimShown = clamp01(this.aimShown + (this.aimTarget ? frame : -frame) / AIM_SECONDS);
    this.showAim();

    this.judge();
    if (this.phase !== 'play') {
      this.phaseAge += dt;
      const stay = this.phase === 'won' ? WON_SECONDS : LOST_SECONDS;
      if (this.phaseAge >= stay + LEAVE_SECONDS) {
        this.build();
      }
    }
  }

  private place() {
    const stay = this.phase === 'won' ? WON_SECONDS : LOST_SECONDS;
    const over = this.phase !== 'play';
    const leaving = over ? 1 - clamp01((this.phaseAge - stay) / LEAVE_SECONDS) : 1;
    const cheer = this.phase === 'won' ? clamp01(1 - this.phaseAge / stay) : 0;

    const { pose } = this;
    let redrawn = false;
    for (const [index, view] of this.blockViews.entries()) {
      // Most of the map stands still most of the time; those blocks are drawn once.
      const fixed = !over && (view.mode === 'still' || view.mode === 'gone');
      if (fixed && view.drawn) {
        continue;
      }
      view.drawn = fixed;
      redrawn = true;
      pose.position.copy(view.position);
      if (cheer > 0 && view.mode === 'still') {
        const ring = (Math.hypot(view.home.x, view.home.z) * 0.7) / RAT - this.phaseAge * 9;
        pose.position.y += 0.35 * RAT * cheer * Math.max(0, Math.sin(ring));
      }
      pose.quaternion.copy(view.rotation);
      pose.scale.setScalar(view.mode === 'gone' ? 0 : view.size * leaving);
      pose.updateMatrix();
      this.mesh.setMatrixAt(index, pose.matrix);
    }
    if (redrawn) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }

    for (const [id, view] of this.ratViews) {
      const { model, shadow } = view;
      const size = view.scale * leaving * RAT;
      model.visible = view.mode !== 'gone' && view.scale > 0;
      model.position.copy(view.position);
      // The shadow stays on the ground under a hop and leaves once the rat is in the air.
      shadow.visible = model.visible && view.mode !== 'flying';
      shadow.position.copy(view.position);
      shadow.position.y += SHADOW_LIFT;
      shadow.rotation.y = view.facing;
      shadow.scale.set(SHADOW.across * size, 1, SHADOW.along * size);
      if (view.mode === 'still') {
        const hop = this.phase === 'lost' ? Math.abs(Math.sin(this.phaseAge * 9 + id)) * 0.3 : 0;
        model.position.y += hop * RAT;
      }
      model.rotation.set(view.tumble, view.facing, view.tumble * 0.6);
      const breath = view.mode === 'still' ? 1 + 0.04 * Math.sin(this.time * 3 + id) : 1;
      model.scale.set(size, size * breath, size);
    }
  }

  private render() {
    this.place();
    const { camera } = this;
    // The shake and lean are put on for the picture only: aiming always works
    // from the view at rest.
    const moved = this.shake > 0.001 || this.punch > 0.0005;
    if (moved) {
      const t = this.time;
      camera.position
        .addScaledVector(
          SCREEN_RIGHT,
          this.shake * (0.6 * Math.sin(t * 61) + 0.4 * Math.sin(t * 37 + 1)),
        )
        .addScaledVector(
          SCREEN_UP,
          this.shake * (0.6 * Math.cos(t * 53) + 0.4 * Math.sin(t * 29 + 2)),
        );
      camera.zoom = 1 + this.punch;
      camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, camera);
    if (moved) {
      camera.position.copy(LOOK_AT).addScaledVector(TOWARD_EYE, EYE_DISTANCE);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    }
  }
}
