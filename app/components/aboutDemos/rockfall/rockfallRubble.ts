import { Quaternion, Vector3 } from 'three';

import { RAT, SIZE, type World, isSolid } from './rockfallWorld';

/**
 * How loose blocks move: each is a solid cube that falls, tumbles, knocks into
 * the others and comes to rest on the standing map or the floor. Contacts are
 * found by testing each cube's corners and face middles against the map's grid
 * and against the cubes near it, and are resolved with impulses at those points.
 * So a cube that lands on a corner topples onto a face by itself, and one hanging
 * over an edge tips off it.
 */
export type Body = {
  /** The cube's middle, in scene coordinates. */
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  /** How fast it turns about each axis, in radians a second, in scene space. */
  spin: Vector3;
  /** The length of its edge, in blocks. */
  size: number;
  /** Seconds it has lain still. */
  rest: number;
  /** Came down as part of a piece and has not hit anything hard yet. */
  intact: boolean;
};

/** A block of a piece that came down whole hitting something hard, and how fast. */
export type Impact<T extends Body = Body> = { body: T; speed: number };

/**
 * Blocks a second, every second. Speeds here are set against the size of a rat,
 * so that the map can be built finer without everything on it moving slower.
 */
export const GRAVITY = 26 * RAT;
/** How much of its speed a block keeps when it bounces, and the slowest hit that bounces at all. */
const RESTITUTION = 0.2;
const BOUNCE_FROM = 2 * RAT;
/** A hit at least this fast breaks up a piece that came down whole. */
const SHATTER = 4 * RAT;
/** How hard a piece flies apart then, against how fast it hit. */
const BREAK = { sideways: 0.12, spin: 0.25 };
const FRICTION = 0.6;
/** Rounds of the contact solver each step; a pile needs a few to settle. */
const ITERATIONS = 5;
/** The longest step, and the furthest a block may move in one, so none passes through a floor. */
const STEP = 1 / 60;
const MOVE = 0.3;
const MAX_STEPS = 6;
/** Overlap left alone, so a block at rest keeps touching what it lies on. */
const SLOP = 0.01;
/** How much of the remaining overlap is pushed out each step. */
const PUSH = 0.6;
/** Slower than this, a block touching something counts as lying still. */
const STILL = { speed: 0.2 * RAT, spin: 0.6 };
/**
 * A block lying still this long stops being moved and holds up the rest like the
 * map does, until something hits it harder than `WAKE`.
 */
const SLEEP = 0.3;
const WAKE = 0.8 * RAT;
/** How many layers of a pile are told apart, counting up from the ground. */
const LEVELS = 32;
/** How quickly turning dies away while a block touches something, per second. */
const ROLLING = 2.5;
/** Blocks shrinking away keep at least this much weight, so they cannot fling the rest. */
const LIGHTEST = 0.3;
/** The grid that finds the blocks near each other: wider than any two blocks that can touch. */
const CELL = 1.8;
const SPAN = 48;
const LIFT = 40;
const OFFSET = (SPAN * CELL) / 2;
const CELLS = SPAN * SPAN * LIFT;
/** Block coordinates have the map's corner at the origin; the scene has its middle there. */
const SHIFT = SIZE / 2;
const ROOT3 = Math.sqrt(3);
/** Corners, then face middles, as multiples of half the edge. */
const PROBES = [
  -1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 0, 0, -1,
  0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1,
];
const PROBE_COUNT = PROBES.length / 3;
/** The deepest few of the points two cubes have in each other are enough to hold them apart. */
const PAIR_CONTACTS = 4;

// One contact, as numbers in a row: the two bodies (-1 for the map), the normal
// that pushes the first out, each body's lever to the point, two tangents, the
// solver's effective masses, target speed and impulses so far, and the overlap.
const C_A = 0;
const C_B = 1;
const C_N = 2;
const C_RA = 5;
const C_RB = 8;
const C_T1 = 11;
const C_T2 = 14;
const C_KN = 17;
const C_KT1 = 18;
const C_KT2 = 19;
const C_BIAS = 20;
const C_JN = 21;
const C_JT1 = 22;
const C_JT2 = 23;
const C_DEPTH = 24;
// Which of the two bodies an impulse moves: both that are awake, and in the
// solver's last round only the one further from the ground.
const C_WA = 25;
const C_WB = 26;
const C_SA = 27;
const C_SB = 28;
const C_KNS = 29;
const C_KT1S = 30;
const C_KT2S = 31;
const STRIDE = 32;
const CANDIDATE = 9;

const between = (low: number, high: number) => low + Math.random() * (high - low);
const cellOf = (value: number, offset: number, span: number) =>
  Math.min(span - 1, Math.max(0, Math.floor((value + offset) / CELL)));

/** A body at rest where a block of the map stands. */
export function bodyAt(position: Vector3): Body {
  return {
    position,
    velocity: new Vector3(),
    rotation: new Quaternion(),
    spin: new Vector3(),
    size: 1,
    rest: 0,
    intact: false,
  };
}

export class Rubble {
  private capacity = 0;
  /** Each body's axes in scene space, three columns of three. */
  private basis = new Float64Array(0);
  /** Each body's probe points in scene space. */
  private points = new Float64Array(0);
  private inverseMass = new Float64Array(0);
  private inverseTurn = new Float64Array(0);
  /** How far each body is to be pushed out of what it overlaps, and by how many contacts. */
  private shove = new Float64Array(0);
  private touched = new Uint8Array(0);
  private asleep = new Uint8Array(0);
  private woken = new Uint8Array(0);
  /** How many blocks each body is above the ground or a sleeping block, through the pile. */
  private level = new Int32Array(0);
  private chain = new Int32Array(0);
  /** The order contacts are solved in: from the ground up, which settles a pile far sooner. */
  private order = new Int32Array(1024);
  private keys = new Int32Array(1024);
  private readonly tally = new Int32Array(LEVELS + 1);
  /** Two grids end to end: loose blocks, then sleeping ones. */
  private readonly heads = new Int32Array(CELLS * 2);
  private readonly stamps = new Uint32Array(CELLS * 2);
  private stamp = 0;
  private contacts = new Float64Array(STRIDE * 1024);
  private count = 0;
  private readonly candidates = new Float64Array(PROBE_COUNT * 2 * CANDIDATE);
  private readonly relative = new Float64Array(3);
  private readonly broken: number[] = [];
  private readonly brokenSpeed: number[] = [];

  /** Moves every loose body on by `seconds`, adding any hard landings to `impacts`. */
  simulate<T extends Body>(world: World, bodies: T[], seconds: number, impacts?: Impact<T>[]) {
    if (!bodies.length || seconds <= 0) {
      return;
    }
    this.reserve(bodies.length);
    let fastest = 0;
    for (const body of bodies) {
      fastest = Math.max(fastest, body.velocity.lengthSq());
    }
    const steps = Math.min(
      MAX_STEPS,
      Math.max(Math.ceil(seconds / STEP), Math.ceil((Math.sqrt(fastest) * seconds) / MOVE)),
    );
    const dt = seconds / steps;
    for (let step = 0; step < steps; step++) {
      this.step(world, bodies, dt, impacts);
    }
  }

  private reserve(size: number) {
    if (size <= this.capacity) {
      return;
    }
    const capacity = Math.max(size, this.capacity * 2, 64);
    this.capacity = capacity;
    this.basis = new Float64Array(capacity * 9);
    this.points = new Float64Array(capacity * PROBE_COUNT * 3);
    this.inverseMass = new Float64Array(capacity);
    this.inverseTurn = new Float64Array(capacity);
    this.shove = new Float64Array(capacity * 4);
    this.touched = new Uint8Array(capacity);
    this.asleep = new Uint8Array(capacity);
    this.woken = new Uint8Array(capacity);
    this.level = new Int32Array(capacity);
    this.chain = new Int32Array(capacity);
  }

  private step<T extends Body>(world: World, bodies: T[], dt: number, impacts?: Impact<T>[]) {
    const count = bodies.length;
    const { asleep, woken, touched } = this;
    for (let i = 0; i < count; i++) {
      const body = bodies[i];
      asleep[i] = body.rest >= SLEEP ? 1 : 0;
      if (!asleep[i]) {
        body.velocity.y -= GRAVITY * dt;
      }
      this.prepare(body, i);
    }
    this.count = 0;
    this.broken.length = 0;
    this.brokenSpeed.length = 0;
    touched.fill(0, 0, count);
    woken.fill(0, 0, count);
    for (let i = 0; i < count; i++) {
      if (!asleep[i]) {
        this.ground(world, bodies, i);
      }
    }
    this.pairs(bodies);
    this.rank();
    this.presolve(bodies);
    for (let round = 0; round < ITERATIONS; round++) {
      this.solve(bodies, round === ITERATIONS - 1);
    }
    for (const [index, i] of this.broken.entries()) {
      const body = bodies[i];
      const speed = this.brokenSpeed[index];
      body.velocity.x += between(-1, 1) * BREAK.sideways * speed;
      body.velocity.z += between(-1, 1) * BREAK.sideways * speed;
      body.spin.x += between(-1, 1) * BREAK.spin * speed;
      body.spin.y += between(-0.4, 0.4) * BREAK.spin * speed;
      body.spin.z += between(-1, 1) * BREAK.spin * speed;
      impacts?.push({ body, speed });
    }
    for (let i = 0; i < count; i++) {
      if (!asleep[i]) {
        this.integrate(bodies[i], dt);
      }
    }
    this.separate(bodies, dt);
    for (let i = 0; i < count; i++) {
      const body = bodies[i];
      if (asleep[i]) {
        body.rest = woken[i] ? 0 : body.rest + dt;
        continue;
      }
      if (!touched[i]) {
        body.rest = 0;
        continue;
      }
      body.spin.multiplyScalar(Math.exp(-ROLLING * dt));
      const still =
        body.velocity.lengthSq() < STILL.speed ** 2 && body.spin.lengthSq() < STILL.spin ** 2;
      body.rest = still ? body.rest + dt : 0;
      if (body.rest >= SLEEP) {
        body.velocity.set(0, 0, 0);
        body.spin.set(0, 0, 0);
      }
    }
  }

  private prepare(body: Body, i: number) {
    const { basis, points } = this;
    const { x, y, z, w } = body.rotation;
    const o = i * 9;
    basis[o] = 1 - 2 * (y * y + z * z);
    basis[o + 1] = 2 * (x * y + w * z);
    basis[o + 2] = 2 * (x * z - w * y);
    basis[o + 3] = 2 * (x * y - w * z);
    basis[o + 4] = 1 - 2 * (x * x + z * z);
    basis[o + 5] = 2 * (y * z + w * x);
    basis[o + 6] = 2 * (x * z + w * y);
    basis[o + 7] = 2 * (y * z - w * x);
    basis[o + 8] = 1 - 2 * (x * x + y * y);
    const half = body.size / 2;
    const { position } = body;
    const base = i * PROBE_COUNT * 3;
    for (let k = 0; k < PROBE_COUNT * 3; k += 3) {
      const lx = PROBES[k] * half;
      const ly = PROBES[k + 1] * half;
      const lz = PROBES[k + 2] * half;
      points[base + k] = position.x + lx * basis[o] + ly * basis[o + 3] + lz * basis[o + 6];
      points[base + k + 1] = position.y + lx * basis[o + 1] + ly * basis[o + 4] + lz * basis[o + 7];
      points[base + k + 2] = position.z + lx * basis[o + 2] + ly * basis[o + 5] + lz * basis[o + 8];
    }
    // A cube of even density: its weight goes with its volume, and it turns as
    // easily about any axis, which keeps the turning a single number.
    const edge = Math.max(body.size, LIGHTEST);
    this.inverseMass[i] = 1 / edge ** 3;
    this.inverseTurn[i] = 6 / edge ** 5;
  }

  /** Contacts between one body and the standing map or the floor. */
  private ground(world: World, bodies: Body[], i: number) {
    const { points } = this;
    const base = i * PROBE_COUNT * 3;
    for (let k = 0; k < PROBE_COUNT * 3; k += 3) {
      const px = points[base + k];
      const py = points[base + k + 1];
      const pz = points[base + k + 2];
      if (py < 0) {
        this.add(bodies, i, -1, 0, 1, 0, -py, px, py, pz);
        continue;
      }
      const cx = Math.floor(px + SHIFT);
      const cy = Math.floor(py);
      const cz = Math.floor(pz + SHIFT);
      if (!isSolid(world, cx, cy, cz)) {
        continue;
      }
      // Out through the nearest open face on the side the body's middle is on, so a
      // point pushed past the middle of a block is not pushed out the far side.
      const fx = px + SHIFT - cx;
      const fy = py - cy;
      const fz = pz + SHIFT - cz;
      const { position } = bodies[i];
      const ox = position.x + SHIFT - cx - 0.5;
      const oy = position.y - cy - 0.5;
      const oz = position.z + SHIFT - cz - 0.5;
      let depth = Infinity;
      let nx = 0;
      let ny = 1;
      let nz = 0;
      if (oy > -0.5 && !isSolid(world, cx, cy + 1, cz)) {
        depth = 1 - fy;
      }
      if (ox > 0 && 1 - fx < depth && !isSolid(world, cx + 1, cy, cz)) {
        depth = 1 - fx;
        nx = 1;
        ny = 0;
        nz = 0;
      }
      if (ox < 0 && fx < depth && !isSolid(world, cx - 1, cy, cz)) {
        depth = fx;
        nx = -1;
        ny = 0;
        nz = 0;
      }
      if (oz > 0 && 1 - fz < depth && !isSolid(world, cx, cy, cz + 1)) {
        depth = 1 - fz;
        nx = 0;
        ny = 0;
        nz = 1;
      }
      if (oz < 0 && fz < depth && !isSolid(world, cx, cy, cz - 1)) {
        depth = fz;
        nx = 0;
        ny = 0;
        nz = -1;
      }
      if (oy < -0.5 && fy < depth && cy > 0 && !isSolid(world, cx, cy - 1, cz)) {
        depth = fy;
        nx = 0;
        ny = -1;
        nz = 0;
      }
      if (depth === Infinity) {
        // No open face on that side: straight up is the way out.
        nx = 0;
        ny = 1;
        nz = 0;
        depth = 1 - fy;
      }
      this.add(bodies, i, -1, nx, ny, nz, depth, px, py, pz);
    }
  }

  /**
   * Contacts between bodies, found through a grid so each is tried only against
   * its neighbours. Blocks of a piece still falling whole never meet each other,
   * and sleeping blocks never meet each other, so neither kind looks for its own:
   * loose blocks go in one grid and sleeping ones in another, and each body looks
   * only in the grids that hold what it can run into.
   */
  private pairs(bodies: Body[]) {
    const { heads, stamps, chain, asleep } = this;
    this.stamp = (this.stamp + 1) >>> 0;
    if (this.stamp === 0) {
      stamps.fill(0);
      this.stamp = 1;
    }
    const { stamp } = this;
    for (let i = 0; i < bodies.length; i++) {
      if (!asleep[i] && bodies[i].intact) {
        continue;
      }
      const { x, y, z } = bodies[i].position;
      const cell =
        (asleep[i] ? CELLS : 0) +
        cellOf(x, OFFSET, SPAN) +
        SPAN * (cellOf(z, OFFSET, SPAN) + SPAN * cellOf(y, 0, LIFT));
      if (stamps[cell] !== stamp) {
        stamps[cell] = stamp;
        heads[cell] = -1;
      }
      chain[i] = heads[cell];
      heads[cell] = i;
    }
    for (let i = 0; i < bodies.length; i++) {
      if (asleep[i]) {
        continue;
      }
      const loose = !bodies[i].intact;
      const { x, y, z } = bodies[i].position;
      const cx = cellOf(x, OFFSET, SPAN);
      const cy = cellOf(y, 0, LIFT);
      const cz = cellOf(z, OFFSET, SPAN);
      for (let dy = -1; dy <= 1; dy++) {
        const gy = cy + dy;
        if (gy < 0 || gy >= LIFT) {
          continue;
        }
        for (let dz = -1; dz <= 1; dz++) {
          const gz = cz + dz;
          if (gz < 0 || gz >= SPAN) {
            continue;
          }
          for (let dx = -1; dx <= 1; dx++) {
            const gx = cx + dx;
            if (gx < 0 || gx >= SPAN) {
              continue;
            }
            const cell = gx + SPAN * (gz + SPAN * gy);
            // Two loose blocks meet once: from the earlier one in their shared
            // cell, and otherwise only from the cell behind the other.
            const own = dx === 0 && dy === 0 && dz === 0;
            const ahead = dy > 0 || (dy === 0 && (dz > 0 || (dz === 0 && dx > 0)));
            if (stamps[cell] === stamp && (!loose || own || ahead)) {
              for (let j = heads[cell]; j >= 0; j = chain[j]) {
                if (!loose || !own || j > i) {
                  this.meet(bodies, i, j);
                }
              }
            }
            if (stamps[cell + CELLS] === stamp) {
              for (let j = heads[cell + CELLS]; j >= 0; j = chain[j]) {
                this.meet(bodies, i, j);
              }
            }
          }
        }
      }
    }
  }

  private meet(bodies: Body[], i: number, j: number) {
    const a = bodies[i];
    const b = bodies[j];
    const reach = ((a.size + b.size) / 2) * ROOT3;
    if (a.position.distanceToSquared(b.position) >= reach * reach || !a.size || !b.size) {
      return;
    }
    let found = this.probe(bodies, i, j, 0);
    found = this.probe(bodies, j, i, found);
    const { candidates } = this;
    for (let kept = 0; kept < PAIR_CONTACTS && found > 0; kept++) {
      let deepest = 0;
      for (let c = 1; c < found; c++) {
        if (candidates[c * CANDIDATE + 5] > candidates[deepest * CANDIDATE + 5]) {
          deepest = c;
        }
      }
      const o = deepest * CANDIDATE;
      this.add(
        bodies,
        candidates[o],
        candidates[o + 1],
        candidates[o + 2],
        candidates[o + 3],
        candidates[o + 4],
        candidates[o + 5],
        candidates[o + 6],
        candidates[o + 7],
        candidates[o + 8],
      );
      found--;
      candidates.copyWithin(o, found * CANDIDATE, found * CANDIDATE + CANDIDATE);
    }
  }

  /** Collects the probe points of `owner` that lie inside `other`. */
  private probe(bodies: Body[], owner: number, other: number, found: number) {
    const { basis, points, candidates } = this;
    const centre = bodies[other].position;
    const half = bodies[other].size / 2;
    const o = other * 9;
    const base = owner * PROBE_COUNT * 3;
    // Which side of `other` the owner's middle is on, along each of its axes: a
    // point is always pushed out on that side, never through the far one, even
    // when the two met fast enough for it to be past the middle already.
    const mx = bodies[owner].position.x - centre.x;
    const my = bodies[owner].position.y - centre.y;
    const mz = bodies[owner].position.z - centre.z;
    const s0 = mx * basis[o] + my * basis[o + 1] + mz * basis[o + 2] < 0 ? -1 : 1;
    const s1 = mx * basis[o + 3] + my * basis[o + 4] + mz * basis[o + 5] < 0 ? -1 : 1;
    const s2 = mx * basis[o + 6] + my * basis[o + 7] + mz * basis[o + 8] < 0 ? -1 : 1;
    let count = found;
    for (let k = 0; k < PROBE_COUNT * 3; k += 3) {
      const px = points[base + k];
      const py = points[base + k + 1];
      const pz = points[base + k + 2];
      const dx = px - centre.x;
      const dy = py - centre.y;
      const dz = pz - centre.z;
      const q0 = dx * basis[o] + dy * basis[o + 1] + dz * basis[o + 2];
      if (Math.abs(q0) >= half) {
        continue;
      }
      const q1 = dx * basis[o + 3] + dy * basis[o + 4] + dz * basis[o + 5];
      if (Math.abs(q1) >= half) {
        continue;
      }
      const q2 = dx * basis[o + 6] + dy * basis[o + 7] + dz * basis[o + 8];
      if (Math.abs(q2) >= half) {
        continue;
      }
      // How far the point is from leaving through the face on the owner's side.
      const e0 = half - q0 * s0;
      const e1 = half - q1 * s1;
      const e2 = half - q2 * s2;
      const axis = e0 <= e1 && e0 <= e2 ? 0 : e1 <= e2 ? 1 : 2;
      const sign = axis === 0 ? s0 : axis === 1 ? s1 : s2;
      const c = count * CANDIDATE;
      candidates[c] = owner;
      candidates[c + 1] = other;
      candidates[c + 2] = sign * basis[o + axis * 3];
      candidates[c + 3] = sign * basis[o + axis * 3 + 1];
      candidates[c + 4] = sign * basis[o + axis * 3 + 2];
      candidates[c + 5] = Math.min(e0, e1, e2);
      candidates[c + 6] = px;
      candidates[c + 7] = py;
      candidates[c + 8] = pz;
      count++;
    }
    return count;
  }

  private add(
    bodies: Body[],
    a: number,
    b: number,
    nx: number,
    ny: number,
    nz: number,
    depth: number,
    px: number,
    py: number,
    pz: number,
  ) {
    if ((this.count + 1) * STRIDE > this.contacts.length) {
      const grown = new Float64Array(this.contacts.length * 2);
      grown.set(this.contacts);
      this.contacts = grown;
      this.order = new Int32Array(grown.length / STRIDE);
      this.keys = new Int32Array(grown.length / STRIDE);
    }
    const c = this.contacts;
    const o = this.count * STRIDE;
    const pa = bodies[a].position;
    c[o + C_A] = a;
    c[o + C_B] = b;
    c[o + C_N] = nx;
    c[o + C_N + 1] = ny;
    c[o + C_N + 2] = nz;
    c[o + C_RA] = px - pa.x;
    c[o + C_RA + 1] = py - pa.y;
    c[o + C_RA + 2] = pz - pa.z;
    if (b >= 0) {
      const pb = bodies[b].position;
      c[o + C_RB] = px - pb.x;
      c[o + C_RB + 1] = py - pb.y;
      c[o + C_RB + 2] = pz - pb.z;
      this.touched[b] = 1;
    }
    c[o + C_DEPTH] = depth;
    c[o + C_WA] = this.asleep[a] ? 0 : 1;
    c[o + C_WB] = b < 0 || this.asleep[b] ? 0 : 1;
    this.touched[a] = 1;
    this.count++;
  }

  /**
   * Counts each body's layer in its pile, from what it stands on, and sorts the
   * contacts to be solved from the bottom layer up.
   */
  private rank() {
    const c = this.contacts;
    const { level, asleep, keys, order, tally } = this;
    const end = this.count * STRIDE;
    for (let i = 0; i < asleep.length; i++) {
      level[i] = asleep[i] ? 0 : LEVELS - 1;
    }
    for (let o = 0; o < end; o += STRIDE) {
      if (c[o + C_B] < 0 && c[o + C_N + 1] > 0.5) {
        level[c[o + C_A]] = 0;
      }
    }
    for (let pass = 0; pass < 4; pass++) {
      for (let o = 0; o < end; o += STRIDE) {
        const b = c[o + C_B];
        const ny = c[o + C_N + 1];
        if (b < 0 || Math.abs(ny) <= 0.5) {
          continue;
        }
        const a = c[o + C_A];
        const upper = ny > 0 ? a : b;
        const lower = ny > 0 ? b : a;
        level[upper] = Math.min(level[upper], level[lower] + 1);
      }
    }
    tally.fill(0);
    for (let k = 0; k < this.count; k++) {
      const o = k * STRIDE;
      const a = c[o + C_A];
      const b = c[o + C_B];
      c[o + C_SA] = c[o + C_WA];
      c[o + C_SB] = c[o + C_WB];
      let key = 0;
      if (b >= 0) {
        // The body nearer the ground holds still for the other in the last round.
        if (level[a] < level[b]) {
          c[o + C_SA] = 0;
        } else if (level[b] < level[a]) {
          c[o + C_SB] = 0;
        }
        key = Math.min(LEVELS, Math.min(level[a], level[b]) + 1);
      }
      keys[k] = key;
      tally[key]++;
    }
    let start = 0;
    for (let key = 0; key <= LEVELS; key++) {
      const size = tally[key];
      tally[key] = start;
      start += size;
    }
    for (let k = 0; k < this.count; k++) {
      order[tally[keys[k]]++] = k;
    }
  }

  /** The speed of the first body against the second at a contact, into `relative`. */
  private velocityAt(bodies: Body[], o: number) {
    const c = this.contacts;
    const a = bodies[c[o + C_A]];
    const b = c[o + C_B];
    const rx = c[o + C_RA];
    const ry = c[o + C_RA + 1];
    const rz = c[o + C_RA + 2];
    const { velocity: va, spin: wa } = a;
    let vx = va.x + wa.y * rz - wa.z * ry;
    let vy = va.y + wa.z * rx - wa.x * rz;
    let vz = va.z + wa.x * ry - wa.y * rx;
    if (b >= 0) {
      const { velocity: vb, spin: wb } = bodies[b];
      const sx = c[o + C_RB];
      const sy = c[o + C_RB + 1];
      const sz = c[o + C_RB + 2];
      vx -= vb.x + wb.y * sz - wb.z * sy;
      vy -= vb.y + wb.z * sx - wb.x * sz;
      vz -= vb.z + wb.x * sy - wb.y * sx;
    }
    this.relative[0] = vx;
    this.relative[1] = vy;
    this.relative[2] = vz;
  }

  /**
   * The inverse of how hard it is to change the speed at a contact along one
   * direction, counting only the bodies whose weights are set; 0 if neither moves.
   */
  private give(o: number, d: number, wa: number, wb: number) {
    const c = this.contacts;
    const dx = c[o + d];
    const dy = c[o + d + 1];
    const dz = c[o + d + 2];
    const total =
      (c[o + wa] ? this.lever(c[o + C_A], o + C_RA, dx, dy, dz) : 0) +
      (c[o + wb] ? this.lever(c[o + C_B], o + C_RB, dx, dy, dz) : 0);
    return total > 0 ? 1 / total : 0;
  }

  private lever(body: number, at: number, dx: number, dy: number, dz: number) {
    const c = this.contacts;
    const cx = c[at + 1] * dz - c[at + 2] * dy;
    const cy = c[at + 2] * dx - c[at] * dz;
    const cz = c[at] * dy - c[at + 1] * dx;
    return this.inverseMass[body] + this.inverseTurn[body] * (cx * cx + cy * cy + cz * cz);
  }

  private presolve(bodies: Body[]) {
    const c = this.contacts;
    for (let o = 0; o < this.count * STRIDE; o += STRIDE) {
      const nx = c[o + C_N];
      const ny = c[o + C_N + 1];
      const nz = c[o + C_N + 2];
      // Two directions along the surface.
      let tx = 0;
      let ty = nz;
      let tz = -ny;
      if (Math.abs(nx) > 0.57) {
        tx = ny;
        ty = -nx;
        tz = 0;
      }
      const length = Math.hypot(tx, ty, tz);
      tx /= length;
      ty /= length;
      tz /= length;
      c[o + C_T1] = tx;
      c[o + C_T1 + 1] = ty;
      c[o + C_T1 + 2] = tz;
      c[o + C_T2] = ny * tz - nz * ty;
      c[o + C_T2 + 1] = nz * tx - nx * tz;
      c[o + C_T2 + 2] = nx * ty - ny * tx;
      c[o + C_KN] = this.give(o, C_N, C_WA, C_WB);
      c[o + C_KT1] = this.give(o, C_T1, C_WA, C_WB);
      c[o + C_KT2] = this.give(o, C_T2, C_WA, C_WB);
      c[o + C_KNS] = this.give(o, C_N, C_SA, C_SB);
      c[o + C_KT1S] = this.give(o, C_T1, C_SA, C_SB);
      c[o + C_KT2S] = this.give(o, C_T2, C_SA, C_SB);
      c[o + C_JN] = 0;
      c[o + C_JT1] = 0;
      c[o + C_JT2] = 0;

      this.velocityAt(bodies, o);
      const closing = this.relative[0] * nx + this.relative[1] * ny + this.relative[2] * nz;
      c[o + C_BIAS] = closing < -BOUNCE_FROM ? -RESTITUTION * closing : 0;
      if (closing < -SHATTER) {
        this.shatter(bodies, c[o + C_A], -closing);
        this.shatter(bodies, c[o + C_B], -closing);
      }
      if (closing < -WAKE) {
        this.woken[c[o + C_A]] = 1;
        if (c[o + C_B] >= 0) {
          this.woken[c[o + C_B]] = 1;
        }
      }
    }
  }

  private shatter(bodies: Body[], i: number, speed: number) {
    if (i >= 0 && bodies[i].intact) {
      bodies[i].intact = false;
      this.broken.push(i);
      this.brokenSpeed.push(speed);
    }
  }

  private solve(bodies: Body[], shock: boolean) {
    const c = this.contacts;
    const { relative, order } = this;
    const wa = shock ? C_SA : C_WA;
    const wb = shock ? C_SB : C_WB;
    for (let k = 0; k < this.count; k++) {
      const o = order[k] * STRIDE;
      const mass = c[o + (shock ? C_KNS : C_KN)];
      if (mass === 0) {
        continue;
      }
      this.velocityAt(bodies, o);
      const along =
        relative[0] * c[o + C_N] + relative[1] * c[o + C_N + 1] + relative[2] * c[o + C_N + 2];
      const pressed = Math.max(0, c[o + C_JN] + (c[o + C_BIAS] - along) * mass);
      this.push(bodies, o, C_N, pressed - c[o + C_JN], wa, wb);
      c[o + C_JN] = pressed;

      const limit = FRICTION * pressed;
      this.grip(bodies, o, C_T1, shock ? C_KT1S : C_KT1, C_JT1, limit, wa, wb);
      this.grip(bodies, o, C_T2, shock ? C_KT2S : C_KT2, C_JT2, limit, wa, wb);
    }
  }

  /** Friction along one tangent, up to `limit`. */
  private grip(
    bodies: Body[],
    o: number,
    tangent: number,
    mass: number,
    total: number,
    limit: number,
    wa: number,
    wb: number,
  ) {
    const c = this.contacts;
    const { relative } = this;
    this.velocityAt(bodies, o);
    const slide =
      relative[0] * c[o + tangent] +
      relative[1] * c[o + tangent + 1] +
      relative[2] * c[o + tangent + 2];
    const held = Math.max(-limit, Math.min(limit, c[o + total] - slide * c[o + mass]));
    this.push(bodies, o, tangent, held - c[o + total], wa, wb);
    c[o + total] = held;
  }

  /**
   * Applies an impulse along direction `d` of a contact: to the first body, and
   * back on the second, each only if its weight is set.
   */
  private push(bodies: Body[], o: number, d: number, amount: number, wa: number, wb: number) {
    if (amount === 0) {
      return;
    }
    const c = this.contacts;
    const jx = c[o + d] * amount;
    const jy = c[o + d + 1] * amount;
    const jz = c[o + d + 2] * amount;
    if (c[o + wa]) {
      this.kick(bodies[c[o + C_A]], c[o + C_A], o + C_RA, jx, jy, jz);
    }
    if (c[o + wb]) {
      this.kick(bodies[c[o + C_B]], c[o + C_B], o + C_RB, -jx, -jy, -jz);
    }
  }

  private kick(body: Body, index: number, at: number, jx: number, jy: number, jz: number) {
    const c = this.contacts;
    const mass = this.inverseMass[index];
    const turn = this.inverseTurn[index];
    const rx = c[at];
    const ry = c[at + 1];
    const rz = c[at + 2];
    body.velocity.x += jx * mass;
    body.velocity.y += jy * mass;
    body.velocity.z += jz * mass;
    body.spin.x += (ry * jz - rz * jy) * turn;
    body.spin.y += (rz * jx - rx * jz) * turn;
    body.spin.z += (rx * jy - ry * jx) * turn;
  }

  private integrate(body: Body, dt: number) {
    const { position, velocity, rotation, spin } = body;
    position.addScaledVector(velocity, dt);
    const { x, y, z, w } = rotation;
    const h = dt / 2;
    rotation
      .set(
        x + h * (spin.x * w + spin.y * z - spin.z * y),
        y + h * (spin.y * w + spin.z * x - spin.x * z),
        z + h * (spin.z * w + spin.x * y - spin.y * x),
        w - h * (spin.x * x + spin.y * y + spin.z * z),
      )
      .normalize();
  }

  /** Pushes overlapping bodies apart by what overlap the step has left. */
  private separate(bodies: Body[], dt: number) {
    const c = this.contacts;
    const { shove, relative } = this;
    shove.fill(0, 0, bodies.length * 4);
    for (let o = 0; o < this.count * STRIDE; o += STRIDE) {
      this.velocityAt(bodies, o);
      const nx = c[o + C_N];
      const ny = c[o + C_N + 1];
      const nz = c[o + C_N + 2];
      const parting = relative[0] * nx + relative[1] * ny + relative[2] * nz;
      const left = (c[o + C_DEPTH] - parting * dt - SLOP) * PUSH;
      if (left <= 0) {
        continue;
      }
      // As in the solver's last round: what is nearer the ground does not give way.
      const a = c[o + C_A];
      const b = c[o + C_B];
      const ma = c[o + C_SA] * this.inverseMass[a];
      const mb = b < 0 ? 0 : c[o + C_SB] * this.inverseMass[b];
      if (ma + mb === 0) {
        continue;
      }
      const share = ma / (ma + mb);
      if (share > 0) {
        shove[a * 4] += nx * left * share;
        shove[a * 4 + 1] += ny * left * share;
        shove[a * 4 + 2] += nz * left * share;
        shove[a * 4 + 3]++;
      }
      if (share < 1) {
        shove[b * 4] -= nx * left * (1 - share);
        shove[b * 4 + 1] -= ny * left * (1 - share);
        shove[b * 4 + 2] -= nz * left * (1 - share);
        shove[b * 4 + 3]++;
      }
    }
    for (let i = 0; i < bodies.length; i++) {
      // Averaged: a cube flat on the ground touches it at five points, all as deep.
      const pushes = shove[i * 4 + 3];
      if (pushes > 0) {
        bodies[i].position.x += shove[i * 4] / pushes;
        bodies[i].position.y += shove[i * 4 + 1] / pushes;
        bodies[i].position.z += shove[i * 4 + 2] / pushes;
      }
    }
  }
}
