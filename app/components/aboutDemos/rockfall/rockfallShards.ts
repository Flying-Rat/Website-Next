import {
  type BufferGeometry,
  InstancedMesh,
  type Material,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';

import { GRAVITY } from './rockfallRubble';
import { SIZE, type World, isSolid } from './rockfallWorld';

export type ShardKind = 'dust' | 'spark' | 'smoke';

/** How many of each kind can be in the air at once; the oldest makes way for a new one. */
const CAPACITY = 360;
/**
 * How each kind moves: the share of gravity it feels (below 0 it rises), how
 * quickly the air slows it, per second, how much it grows over its life, and
 * how fast it turns against a thrown shard.
 */
type Behaviour = { weight: number; drag: number; grow: number; turn: number };
const BEHAVIOUR: Record<ShardKind, Behaviour> = {
  dust: { weight: 1, drag: 0, grow: 1, turn: 1 },
  spark: { weight: 1, drag: 0, grow: 1, turn: 1 },
  smoke: { weight: -0.04, drag: 2.2, grow: 2.1, turn: 0.12 },
};
/** Position, velocity, turning axis, angle, turning speed, size, life, age. */
const STRIDE = 14;
const BOUNCE = 0.3;
const SHIFT = SIZE / 2;

const ZERO = new Matrix4().makeScale(0, 0, 0);
const matrix = new Matrix4();
const turn = new Quaternion();
const at = new Vector3();
const axis = new Vector3();
const scale = new Vector3();

class Pool {
  readonly mesh: InstancedMesh;
  private readonly state = new Float32Array(CAPACITY * STRIDE);
  private next = 0;
  private live = 0;

  constructor(
    geometry: BufferGeometry,
    material: Material,
    private readonly behaviour: Behaviour,
  ) {
    this.mesh = new InstancedMesh(geometry, material, CAPACITY);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < CAPACITY; i++) {
      this.mesh.setMatrixAt(i, ZERO);
    }
  }

  get busy() {
    return this.live > 0;
  }

  add(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    size: number,
    life: number,
  ) {
    const s = this.state;
    const o = this.next * STRIDE;
    this.next = (this.next + 1) % CAPACITY;
    axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    s.set(
      [
        x,
        y,
        z,
        vx,
        vy,
        vz,
        axis.x,
        axis.y,
        axis.z,
        0,
        (8 + Math.random() * 16) * this.behaviour.turn,
        size,
        life,
        0,
      ],
      o,
    );
    this.live++;
  }

  step(world: World, dt: number) {
    if (!this.live) {
      return;
    }
    const s = this.state;
    const { weight, drag, grow } = this.behaviour;
    const slow = Math.exp(-drag * dt);
    let live = 0;
    for (let i = 0; i < CAPACITY; i++) {
      const o = i * STRIDE;
      const life = s[o + 12];
      if (s[o + 13] >= life) {
        continue;
      }
      s[o + 13] += dt;
      if (s[o + 13] >= life) {
        this.mesh.setMatrixAt(i, ZERO);
        continue;
      }
      live++;
      s[o + 4] -= GRAVITY * weight * dt;
      s[o + 3] *= slow;
      s[o + 4] *= slow;
      s[o + 5] *= slow;
      s[o] += s[o + 3] * dt;
      s[o + 1] += s[o + 4] * dt;
      s[o + 2] += s[o + 5] * dt;
      s[o + 9] += s[o + 10] * dt;
      // One look at the map: a shard that falls into the ground bounces off its top.
      const y = s[o + 1];
      const landed =
        y < 0 ||
        isSolid(world, Math.floor(s[o] + SHIFT), Math.floor(y), Math.floor(s[o + 2] + SHIFT));
      if (landed && s[o + 4] < 0) {
        s[o + 1] = Math.max(0, Math.ceil(y)) + 0.01;
        s[o + 4] *= -BOUNCE;
        s[o + 3] *= 0.5;
        s[o + 5] *= 0.5;
        s[o + 10] *= 0.5;
      }
      const t = s[o + 13] / life;
      const left =
        (t < 0.55 ? 1 : 1 - ((t - 0.55) / 0.45) ** 2) * (1 + (grow - 1) * (1 - (1 - t) ** 3));
      at.set(s[o], s[o + 1], s[o + 2]);
      turn.setFromAxisAngle(axis.set(s[o + 6], s[o + 7], s[o + 8]), s[o + 9]);
      matrix.compose(at, turn, scale.setScalar(s[o + 11] * left));
      this.mesh.setMatrixAt(i, matrix);
    }
    this.live = live;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    for (let i = 0; i < CAPACITY; i++) {
      this.state[i * STRIDE + 12] = 0;
      this.mesh.setMatrixAt(i, ZERO);
    }
    this.live = 0;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.dispose();
  }
}

/**
 * Small pieces thrown out by a blast or a heavy landing. They fall and bounce
 * off the ground but run into nothing else, so hundreds cost next to nothing.
 */
export class Shards {
  private readonly pools: Record<ShardKind, Pool>;

  constructor(geometry: BufferGeometry, dust: Material, spark: Material) {
    this.pools = {
      dust: new Pool(geometry, dust, BEHAVIOUR.dust),
      spark: new Pool(geometry, spark, BEHAVIOUR.spark),
      smoke: new Pool(geometry, dust, BEHAVIOUR.smoke),
    };
  }

  get meshes() {
    return Object.values(this.pools).map((pool) => pool.mesh);
  }

  get busy() {
    return Object.values(this.pools).some((pool) => pool.busy);
  }

  /** One shard at `from`, moving at `velocity`, `size` blocks across, gone after `life` seconds. */
  throw(kind: ShardKind, from: Vector3, velocity: Vector3, size: number, life: number) {
    this.pools[kind].add(from.x, from.y, from.z, velocity.x, velocity.y, velocity.z, size, life);
  }

  step(world: World, dt: number) {
    for (const pool of Object.values(this.pools)) {
      pool.step(world, dt);
    }
  }

  clear() {
    for (const pool of Object.values(this.pools)) {
      pool.clear();
    }
  }

  dispose() {
    for (const pool of Object.values(this.pools)) {
      pool.dispose();
    }
  }
}
