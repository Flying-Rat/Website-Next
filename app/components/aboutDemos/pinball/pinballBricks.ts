import {
  type BufferGeometry,
  Color,
  Euler,
  Group,
  InstancedMesh,
  type Material,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { BRICK_TALL, DECK, type PinballModels, onTable } from './pinballModels';
import { type Brick, GRID, HEIGHT, type Point, type Table, WIDTH } from './pinballTable';

type View = {
  brick: Brick;
  mesh: InstancedMesh;
  index: number;
  tall: number;
  /** How much lighter than the stone tone it is drawn, from its height. */
  shade: number;
  /** Seconds since it started to rise; negative while it waits its turn. */
  age: number;
  /** How long after a win it waits before it bursts. */
  leaveAfter: number;
  burst: boolean;
};

type Piece = {
  position: Vector3;
  velocity: Vector3;
  rotation: Euler;
  spin: Vector3;
  size: Vector3;
  color: Color;
  age: number;
  life: number;
};

const MAX_STONES = GRID.columns * GRID.rows;
const MAX_BOMBS = 8;
const MAX_HAZARDS = 16;
const MAX_PIECES = 1100;
const RISE_SECONDS = 0.4;
const GRAVITY = 1150;
/** The lowest a brick stands; the rest rise and fall across the field like terrain. */
const LOW = 4.5;

const between = (low: number, high: number) => low + Math.random() * (high - low);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
/** Past the end and back, for things that pop into place. */
const overshoot = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

function instanced(geometry: BufferGeometry, material: Material, count: number) {
  const mesh = new InstancedMesh(geometry, material, count);
  // Its bounds change with every table and every flying piece.
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.count = 0;
  return mesh;
}

/**
 * The field of small bricks and everything that flies out of it: each broken
 * brick leaves the table as a tumbling block, with a few chips after it.
 */
export class BrickField {
  readonly group = new Group();
  private readonly stones: InstancedMesh;
  private readonly bombs: InstancedMesh;
  private readonly spikes: InstancedMesh;
  private readonly debris: InstancedMesh;
  /** Debris turns about its own middle, unlike a brick, which stands on its foot. */
  private readonly block = new RoundedBoxGeometry(1, 1, 1, 1, 0.14);
  private readonly pose = new Object3D();
  private readonly hidden = new Matrix4().makeScale(0, 0, 0);
  private readonly turn = new Quaternion();
  private views: View[] = [];
  private byBrick = new Map<Brick, View>();
  private pieces: Piece[] = [];
  private winAge = -1;

  constructor(
    private models: PinballModels,
    private animate: boolean,
  ) {
    this.stones = instanced(models.cell, models.stone, MAX_STONES);
    this.bombs = instanced(models.cell, models.bomb, MAX_BOMBS);
    this.spikes = instanced(models.spike, models.hazard, MAX_HAZARDS);
    this.debris = instanced(this.block, models.debris, MAX_PIECES);
    this.debris.receiveShadow = false;
    // Instance colours have to exist before the first draw, or the shader is built without them.
    for (const mesh of [this.stones, this.debris]) {
      mesh.setColorAt(0, new Color(1, 1, 1));
    }
    this.group.add(this.stones, this.bombs, this.spikes, this.debris);
  }

  get busy() {
    return this.pieces.length > 0 || this.views.some((view) => view.age < RISE_SECONDS);
  }

  deal(table: Table) {
    this.pieces = [];
    this.winAge = -1;
    this.views = [];
    this.byBrick = new Map();
    const phase = [Math.random() * 6.3, Math.random() * 6.3];
    const counts = new Map<InstancedMesh, number>([
      [this.stones, 0],
      [this.bombs, 0],
      [this.spikes, 0],
    ]);
    for (const brick of table.bricks) {
      const mesh =
        brick.kind === 'bomb' ? this.bombs : brick.kind === 'hazard' ? this.spikes : this.stones;
      const index = counts.get(mesh) ?? 0;
      if (index >= mesh.instanceMatrix.count) {
        continue;
      }
      counts.set(mesh, index + 1);
      const swell =
        0.55 * (0.5 + 0.5 * Math.sin(brick.x * 0.052 + phase[0])) +
        0.45 * (0.5 + 0.5 * Math.sin(brick.y * 0.12 + brick.x * 0.02 + phase[1]));
      const rise =
        brick.kind === 'brick' ? swell * (BRICK_TALL - LOW - 1) + between(0, 1) : BRICK_TALL - 2;
      const view: View = {
        brick,
        mesh,
        index,
        tall: LOW + rise,
        shade: swell,
        // The field builds itself from the goal's end toward the flippers.
        age: this.animate ? -(brick.y - GRID.top) * 0.004 - Math.random() * 0.08 : RISE_SECONDS,
        leaveAfter: Math.hypot(brick.x - table.goal.x, brick.y - table.goal.y) * 0.0035,
        burst: false,
      };
      this.views.push(view);
      this.byBrick.set(brick, view);
    }
    for (const [mesh, count] of counts) {
      mesh.count = count;
    }
    this.recolour();
  }

  /** Paints every brick from the models' current tones. */
  recolour() {
    const color = new Color();
    for (const view of this.views) {
      if (view.mesh === this.stones) {
        color.copy(this.models.stoneTone).multiplyScalar(0.78 + 0.34 * view.shade);
        this.stones.setColorAt(view.index, color);
      }
    }
    if (this.stones.instanceColor) {
      this.stones.instanceColor.needsUpdate = true;
    }
  }

  /** Throws a broken brick off the table, pushed along `push`, in table units a second. */
  breakOut(brick: Brick, push: Point, chips = 2) {
    const view = this.byBrick.get(brick);
    if (!view || !this.animate) {
      return;
    }
    const speed = Math.min(Math.hypot(push.x, push.y), 900);
    const along =
      speed > 0
        ? { x: push.x / Math.hypot(push.x, push.y), y: push.y / Math.hypot(push.x, push.y) }
        : { x: 0, y: 0 };
    const color =
      view.mesh === this.stones
        ? this.models.stoneTone.clone().multiplyScalar(0.78 + 0.34 * view.shade)
        : view.mesh === this.bombs
          ? this.models.accentTone.clone()
          : this.models.hazardTone.clone();
    const thrown = (scale: number) =>
      new Vector3(
        along.x * speed * between(0.2, 0.6) * scale + between(-90, 90),
        between(150, 380) + speed * 0.18,
        along.y * speed * between(0.2, 0.6) * scale + between(-90, 90),
      );
    this.add({
      position: onTable(brick.x, brick.y, view.tall / 2),
      velocity: thrown(1),
      rotation: new Euler(),
      spin: new Vector3(between(-10, 10), between(-6, 6), between(-10, 10)),
      size: new Vector3(brick.width, view.tall, brick.height),
      color,
      age: 0,
      life: between(0.9, 1.5),
    });
    for (let i = 0; i < chips; i++) {
      const bit = between(1.2, 2.8);
      this.add({
        position: onTable(brick.x + between(-3, 3), brick.y + between(-3, 3), view.tall),
        velocity: thrown(1.4).multiplyScalar(between(0.9, 1.4)),
        rotation: new Euler(between(0, 3), between(0, 3), between(0, 3)),
        spin: new Vector3(between(-18, 18), between(-18, 18), between(-18, 18)),
        size: new Vector3(bit, bit, bit),
        color: color.clone().multiplyScalar(between(0.85, 1.15)),
        age: 0,
        life: between(0.6, 1.1),
      });
    }
  }

  /** A shower of small chips from one spot, in one colour. */
  spray(at: Point, color: Color, count: number, force: number) {
    if (!this.animate) {
      return;
    }
    for (let i = 0; i < count; i++) {
      const bit = between(1.4, 3.4);
      const angle = between(0, Math.PI * 2);
      const out = between(0.3, 1) * force;
      this.add({
        position: onTable(at.x, at.y, 6),
        velocity: new Vector3(
          Math.cos(angle) * out,
          between(0.8, 1.8) * force,
          Math.sin(angle) * out,
        ),
        rotation: new Euler(between(0, 3), between(0, 3), between(0, 3)),
        spin: new Vector3(between(-16, 16), between(-16, 16), between(-16, 16)),
        size: new Vector3(bit, bit, bit),
        color: color.clone().multiplyScalar(between(0.85, 1.15)),
        age: 0,
        life: between(0.6, 1.2),
      });
    }
  }

  /** Every brick still standing bursts, in a ring running out from the goal. */
  celebrate() {
    this.winAge = 0;
  }

  step(dt: number, goal: Point) {
    for (const view of this.views) {
      view.age += dt;
    }
    if (this.winAge >= 0) {
      this.winAge += dt;
      for (const view of this.views) {
        if (!view.burst && view.brick.alive && this.winAge >= view.leaveAfter) {
          view.burst = true;
          const away = Math.hypot(view.brick.x - goal.x, view.brick.y - goal.y) || 1;
          const push = 500 / Math.max(1, away / 40);
          this.breakOut(
            view.brick,
            {
              x: ((view.brick.x - goal.x) / away) * push,
              y: ((view.brick.y - goal.y) / away) * push,
            },
            0,
          );
        }
      }
    }

    this.pieces = this.pieces.filter((piece) => {
      piece.age += dt;
      piece.velocity.y -= GRAVITY * dt;
      piece.position.addScaledVector(piece.velocity, dt);
      // Over the table they land on it; past its edge they fall to the floor.
      const over =
        Math.abs(piece.position.x) < WIDTH / 2 + 8 && Math.abs(piece.position.z) < HEIGHT / 2;
      const ground = (over ? 0 : -DECK) + Math.min(piece.size.x, piece.size.y, piece.size.z) / 2;
      if (piece.position.y < ground) {
        piece.position.y = ground;
        piece.velocity.y *= -0.32;
        piece.velocity.x *= 0.62;
        piece.velocity.z *= 0.62;
        piece.spin.multiplyScalar(0.6);
      }
      piece.rotation.x += piece.spin.x * dt;
      piece.rotation.y += piece.spin.y * dt;
      piece.rotation.z += piece.spin.z * dt;
      return piece.age < piece.life;
    });
  }

  /** Writes every brick and piece into its instance; `leaving` shrinks the whole field away. */
  place(leaving: number) {
    const { pose } = this;
    for (const view of this.views) {
      const { mesh, index, brick } = view;
      const risen = view.age < 0 ? 0 : overshoot(clamp01(view.age / RISE_SECONDS));
      const size = risen * leaving;
      if (!brick.alive || view.burst || size <= 0) {
        mesh.setMatrixAt(index, this.hidden);
        continue;
      }
      const wide = mesh === this.spikes ? brick.width * 0.8 : brick.width;
      pose.position.copy(onTable(brick.x, brick.y));
      pose.quaternion.identity();
      pose.scale.set(
        wide * size,
        view.tall * size,
        brick.height * (mesh === this.spikes ? 0.8 : 1) * size,
      );
      pose.updateMatrix();
      mesh.setMatrixAt(index, pose.matrix);
    }
    for (const mesh of [this.stones, this.bombs, this.spikes]) {
      mesh.instanceMatrix.needsUpdate = true;
    }

    for (const [index, piece] of this.pieces.entries()) {
      const fade = 1 - clamp01((piece.age - piece.life * 0.65) / (piece.life * 0.35));
      pose.position.copy(piece.position);
      pose.quaternion.copy(this.turn.setFromEuler(piece.rotation));
      pose.scale.copy(piece.size).multiplyScalar(fade);
      pose.updateMatrix();
      this.debris.setMatrixAt(index, pose.matrix);
      this.debris.setColorAt(index, piece.color);
    }
    this.debris.count = this.pieces.length;
    this.debris.instanceMatrix.needsUpdate = true;
    if (this.debris.instanceColor) {
      this.debris.instanceColor.needsUpdate = true;
    }
  }

  clearPieces() {
    this.pieces = [];
  }

  dispose() {
    this.block.dispose();
    for (const mesh of [this.stones, this.bombs, this.spikes, this.debris]) {
      mesh.dispose();
    }
  }

  private add(piece: Piece) {
    // When the pool is full the oldest piece makes way.
    if (this.pieces.length >= MAX_PIECES) {
      this.pieces.shift();
    }
    this.pieces.push(piece);
  }
}
