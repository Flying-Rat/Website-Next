import { Box3, DataTexture, FloatType, RGBAFormat, type Ray, Vector3 } from 'three';

import { COLUMN_BASE, COLUMN_RELIEF, REBUILD_SECONDS } from './shapeSceneConstants';

const BLAST_RADIUS = 1.8;

interface Block {
  slot: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  half: number;
  halfHeight: number;
  tumbleRadius: number;
  angle: number;
  spin: number;
  bounce: number;
  expires: number;
}

/** Only moving blocks enter the solver. Sleeping poses stay in the GPU textures. */
export class BlastPhysics {
  readonly material: DataTexture;
  readonly pose: DataTexture;
  // A loose record holds the horizontal spin axis in x/z and bridge growth in y.
  // w encodes expiry (+10 airborne, negated at rest), 0 intact, or -1 rebuilding.
  private readonly records: Float32Array;
  private readonly transforms: Float32Array;
  clock = 0;
  private readonly pickBox = new Box3();
  private readonly pickPoint = new Vector3();
  private readonly moving: Block[] = [];
  private heightSnapshot?: Uint8Array<ArrayBuffer>;
  private readonly terrainHeights: Float64Array;
  private readonly rebuilding = new Set<number>();
  private nextCompletion = Infinity;
  private readonly resting: Block[] = [];
  private readonly step: number;

  private readonly bridgeCount: number;

  constructor(
    private readonly across: number,
    private readonly radius: number,
    private readonly width: number,
    private readonly anchors: ArrayLike<number>,
    private readonly boxes: ArrayLike<number>,
  ) {
    this.terrainHeights = new Float64Array(across * across);
    this.step = (2 * radius) / across;
    let count = 0;
    while (anchors[count * 3 + 2] < -1) {
      count++;
    }
    this.bridgeCount = count;
    const rows = across + Math.ceil(count / across);
    this.records = new Float32Array(across * rows * 4);
    this.transforms = new Float32Array(this.records.length);

    this.material = new DataTexture(this.records, across, rows, RGBAFormat, FloatType);
    this.pose = new DataTexture(this.transforms, across, rows, RGBAFormat, FloatType);
  }

  get hasLooseBlocks(): boolean {
    return this.moving.length > 0 || this.resting.length > 0;
  }

  get hasDamage(): boolean {
    return this.hasLooseBlocks || this.rebuilding.size > 0;
  }

  get hasRebuildingCells(): boolean {
    return this.rebuilding.size > 0;
  }

  /** Input planes sit above a fresh crater. Intersect the rendered column and
   * bridge bounds at their current growth, only when someone clicks mid-rebuild. */
  pickDuringRebuild(
    ray: Ray,
    target: Vector3,
    heights: Uint8Array<ArrayBuffer>,
    cells: Float32Array,
    bridgeLift: (x: number) => number,
  ): boolean {
    this.readTerrain(heights);
    let nearest = this.pick(ray, target) ? ray.origin.distanceToSquared(target) : Infinity;
    const half = this.width / 2;
    const test = (
      x: number,
      z: number,
      width: number,
      depth: number,
      bottom: number,
      top: number,
    ) => {
      if (top <= bottom) {
        return;
      }
      this.pickBox.min.set(x - width, bottom, z - depth);
      this.pickBox.max.set(x + width, top, z + depth);
      const hit = ray.intersectBox(this.pickBox, this.pickPoint);
      if (hit) {
        const distance = ray.origin.distanceToSquared(hit);
        if (distance < nearest) {
          nearest = distance;
          target.copy(hit);
        }
      }
    };
    // Reject columns whose footprint the ray misses before testing their height.
    const { origin, direction } = ray;
    const margin = half * (Math.abs(direction.x) + Math.abs(direction.z));
    for (let i = 0; i < cells.length; i += 2) {
      const x = cells[i],
        z = cells[i + 1];
      if (Math.abs(direction.x * (z - origin.z) - direction.z * (x - origin.x)) > margin) {
        continue;
      }
      const cell = this.cell(x, z);
      test(x, z, half, half, 0, this.terrainHeights[cell] * this.groundFraction(4 * cell));
    }
    // Bridge parts precede trees and clouds in the prop instance buffer.
    const { anchors, boxes } = this;
    for (let i = 0; i < this.bridgeCount; i++) {
      const x = anchors[i * 3],
        z = anchors[i * 3 + 1];
      const growth = this.groundFraction(4 * (this.across ** 2 + i));
      const bottom = boxes[i * 4 + 2] + bridgeLift(x);
      test(
        x,
        z,
        boxes[i * 4] / 2,
        (-1 - anchors[i * 3 + 2]) / 2,
        bottom * growth,
        (bottom + boxes[i * 4 + 1]) * growth,
      );
    }
    return nearest < Infinity;
  }

  private startRebuild(slot: number, debrisExpiry: number): void {
    // Reuse the spent block's record. The shaders grow it from the ground using
    // this timestamp, so the CPU only touches the texture at the two endpoints.
    const start = Math.max(this.clock, debrisExpiry) + 1.1;
    this.records[slot] = start;
    this.records[slot + 3] = -1;
    this.rebuilding.add(slot);
    this.nextCompletion = Math.min(this.nextCompletion, start + REBUILD_SECONDS);
  }

  private groundFraction(slot: number): number {
    const state = this.records[slot + 3];
    if (state !== -1) {
      return state === 0 ? 1 : 0;
    }
    const t = Math.max(0, Math.min(1, (this.clock - this.records[slot]) / REBUILD_SECONDS));
    return t * t * (3 - 2 * t);
  }

  private cell(x: number, z: number): number {
    const col = Math.floor((x + this.radius) / this.step);
    const row = Math.floor((z + this.radius) / this.step);
    return row * this.across + col;
  }

  private readTerrain(snapshot: Uint8Array<ArrayBuffer>): void {
    if (snapshot === this.heightSnapshot) {
      return;
    }
    this.heightSnapshot = snapshot;
    // The column pass clears absent terrain to transparent black. Decode each
    // snapshot once for picking, blast selection and all subsequent substeps.
    for (let cell = 0; cell < this.terrainHeights.length; cell++) {
      const slot = cell * 4;
      const relief = 256 * snapshot[slot] + snapshot[slot + 1];
      this.terrainHeights[cell] =
        relief || snapshot[slot + 2] || snapshot[slot + 3]
          ? COLUMN_BASE + (COLUMN_RELIEF * 2 * relief) / 65535
          : 0;
    }
  }

  private floor(x: number, z: number): number {
    if (x * x + z * z >= this.radius * this.radius) {
      return -Infinity;
    }
    const cell = this.cell(x, z);
    return this.terrainHeights[cell] * this.groundFraction(cell * 4);
  }

  /** Pick loose blocks at their current positions, including blocks above the scene's input plane. */
  pick(ray: Ray, target: Vector3): boolean {
    let nearest = Infinity;
    for (const blocks of [this.moving, this.resting]) {
      for (const b of blocks) {
        const y = blocks === this.resting ? b.y + this.floor(b.x, b.z) : b.y;
        this.pickPoint.set(b.x, y, b.z);
        const depth = this.pickPoint.sub(ray.origin).dot(ray.direction);
        if (depth <= 0 || depth >= nearest) {
          continue;
        }
        this.pickPoint.set(b.x, y, b.z);
        if (ray.distanceSqToPoint(this.pickPoint) <= 2 * b.half * b.half) {
          nearest = depth;
          target.copy(this.pickPoint);
        }
      }
    }
    return nearest < Infinity;
  }

  private kick(b: Block, dx: number, dz: number, distance: number): void {
    // A buried source sends the centre upward and the outer rim sideways.
    const depth = 0.5 + b.half;
    const falloff = Math.max(0, 1 - distance / BLAST_RADIUS);
    const impulse = (1.4 + 5.1 * falloff) * (0.86 + Math.random() * 0.28);
    const radial = impulse / Math.hypot(distance, depth);
    const dvx = radial * dx;
    const dvz = radial * dz;
    b.vx += dvx;
    b.vz += dvz;
    b.vy += radial * depth + 0.42 * impulse;
    // Off-centre impulse about the cube's tumble axis.
    b.spin +=
      ((this.records[b.slot] * dvz - this.records[b.slot + 2] * dvx) *
        (0.15 + Math.random() * 0.2)) /
      b.half;
    b.expires = this.clock + 2.8 + Math.random();
    this.records[b.slot + 3] = 10 + b.expires;
  }

  detonate(
    x: number,
    z: number,
    animate: boolean,
    heights: Uint8Array<ArrayBuffer>,
    bridgeLift: (x: number) => number,
  ): void {
    this.readTerrain(heights);
    // Process moving pieces first so a newly woken piece receives the impulse once.
    for (const blocks of [this.moving, this.resting]) {
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        const dx = b.x - x,
          dz = b.z - z;
        const distance = Math.hypot(dx, dz);
        if (distance >= BLAST_RADIUS) {
          continue;
        }
        if (!animate) {
          this.startRebuild(b.slot, b.expires);
          blocks.splice(i, 1);
          continue;
        }
        if (blocks === this.resting) {
          b.y += this.floor(b.x, b.z);
          blocks.splice(i, 1);
          this.moving.push(b);
        }
        this.kick(b, dx, dz, distance);
        this.writePose(b);
      }
    }
    const index = (v: number) => Math.floor((v + this.radius) / this.step);
    const lastRow = Math.min(this.across - 1, index(z + BLAST_RADIUS));
    const lastCol = Math.min(this.across - 1, index(x + BLAST_RADIUS));
    const firstCol = Math.max(0, index(x - BLAST_RADIUS));
    for (let row = Math.max(0, index(z - BLAST_RADIUS)); row <= lastRow; row++) {
      const cz = (row + 0.5) * this.step - this.radius;
      const dz = cz - z;
      for (let col = firstCol; col <= lastCol; col++) {
        const cell = row * this.across + col;
        const cx = (col + 0.5) * this.step - this.radius;
        const dx = cx - x;
        const distanceSq = dx * dx + dz * dz;
        const height = this.terrainHeights[cell];
        if (height > 0 && distanceSq <= BLAST_RADIUS * BLAST_RADIUS) {
          this.detach(4 * cell, cx, cz, dx, dz, Math.sqrt(distanceSq), animate, height, -1);
        }
      }
    }
    for (let i = 0; i < this.bridgeCount; i++) {
      const cx = this.anchors[i * 3],
        cz = this.anchors[i * 3 + 1];
      const dx = cx - x,
        dz = cz - z;
      const distance = Math.hypot(dx, dz);
      if (distance > BLAST_RADIUS) {
        continue;
      }
      const center = bridgeLift(cx) + this.boxes[i * 4 + 2] + this.boxes[i * 4 + 1] * 0.5;
      this.detach(4 * (this.across ** 2 + i), cx, cz, dx, dz, distance, animate, center, i);
    }
    this.material.needsUpdate = true;
    this.pose.needsUpdate = true;
  }

  private detach(
    slot: number,
    cx: number,
    cz: number,
    dx: number,
    dz: number,
    distance: number,
    animate: boolean,
    height: number,
    bridgeIndex: number,
  ): void {
    const growth = this.groundFraction(slot);
    if (growth <= 0) {
      // A repeat blast also interrupts cells waiting to emerge beside the hit.
      if (animate && this.rebuilding.has(slot)) {
        this.startRebuild(slot, this.clock + 3.8);
      }
      return;
    }
    this.rebuilding.delete(slot);
    if (!animate) {
      this.startRebuild(slot, this.clock);
      return;
    }
    const side = this.width;
    // Tumble about a real voxel edge, favouring the one across the impulse.
    const tumbleAroundX = Math.random() * (Math.abs(dx) + Math.abs(dz)) < Math.abs(dz);
    this.records[slot] = tumbleAroundX ? 1 : 0;
    const bridge = bridgeIndex >= 0;
    const halfHeight = bridge ? this.boxes[bridgeIndex * 4 + 1] * growth * 0.5 : side * 0.5;
    const halfWidth = bridge ? this.boxes[bridgeIndex * 4] * 0.5 : side * 0.5;
    const halfDepth = bridge ? (-1 - this.anchors[bridgeIndex * 3 + 2]) * 0.5 : side * 0.5;
    this.records[slot + 1] = bridge ? growth : height * growth;
    this.records[slot + 2] = tumbleAroundX ? 0 : 1;
    const block = {
      slot,
      x: cx,
      y: bridge ? height * growth : Math.max(halfHeight, height * growth - halfHeight),
      z: cz,
      vx: 0,
      vy: 0,
      vz: 0,
      half: Math.max(halfWidth, halfDepth, halfHeight),
      halfHeight,
      tumbleRadius: tumbleAroundX ? halfDepth : halfWidth,
      angle: 0,
      spin: 0,
      expires: 0,
      bounce: 0.16 + Math.random() * 0.24,
    };
    this.kick(block, dx, dz, distance);
    this.moving.push(block);
    this.writePose(block);
  }

  private writePose(b: Block): void {
    this.transforms[b.slot] = b.x;
    this.transforms[b.slot + 1] = b.y;
    this.transforms[b.slot + 2] = b.z;
    this.transforms[b.slot + 3] = b.angle;
  }

  update(dt: number): void {
    if (dt <= 0) {
      return;
    }
    this.clock += dt;
    let recordsChanged = false;
    if (this.clock >= this.nextCompletion) {
      this.nextCompletion = Infinity;
      for (const slot of this.rebuilding) {
        const end = this.records[slot] + REBUILD_SECONDS;
        if (end <= this.clock) {
          this.records[slot + 3] = 0;
          this.rebuilding.delete(slot);
          recordsChanged = true;
        } else {
          this.nextCompletion = Math.min(this.nextCompletion, end);
        }
      }
    }
    for (let i = this.resting.length - 1; i >= 0; i--) {
      const b = this.resting[i];
      if (this.clock >= b.expires) {
        this.startRebuild(b.slot, b.expires);
        this.resting.splice(i, 1);
        recordsChanged = true;
      }
    }
    if (!this.moving.length) {
      if (recordsChanged) {
        this.material.needsUpdate = true;
      }
      return;
    }
    // A substep is shorter than the time a fast block takes to cross a mobile cell.
    const steps = Math.ceil(dt * 120);
    const h = dt / steps;
    const airDrag = Math.exp(-0.3 * h);
    const slideDrag = Math.exp(-8 * h);
    const rollDrag = Math.exp(-10 * h);
    for (let i = this.moving.length - 1; i >= 0; i--) {
      const b = this.moving[i];
      let asleep = false;
      let floor = this.floor(b.x, b.z);
      const axisX = this.records[b.slot],
        axisZ = this.records[b.slot + 2];
      for (let k = 0; k < steps && !asleep; k++) {
        b.vx *= airDrag;
        b.vz *= airDrag;
        const nx = b.x + b.vx * h,
          nz = b.z + b.vz * h;
        const nextFloor = this.floor(nx, nz);
        const ledge = Math.max(b.y - b.half, floor) + b.half * 0.45;
        if (nextFloor <= ledge) {
          b.x = nx;
          b.z = nz;
          floor = nextFloor;
        } else {
          // Only resolve axes separately when the step actually hits a voxel wall.
          const oldVx = b.vx,
            oldVz = b.vz;
          if (this.floor(nx, b.z) > ledge) {
            b.vx *= -b.bounce;
          } else {
            b.x = nx;
          }
          if (this.floor(b.x, nz) > ledge) {
            b.vz *= -b.bounce;
          } else {
            b.z = nz;
          }
          b.spin += ((axisX * (b.vz - oldVz) - axisZ * (b.vx - oldVx)) * 0.2) / b.half;
          floor = this.floor(b.x, b.z);
        }
        b.y += (b.vy - 7 * h) * h;
        b.vy -= 14 * h;
        b.angle += b.spin * h;
        if (b.y < -3 || this.clock >= b.expires) {
          this.startRebuild(b.slot, b.expires);
          asleep = true;
          continue;
        }
        // The sum bounds the vertical extent at every angle. Only descending
        // blocks close enough to touch need the exact rotated contact height.
        if (b.vy > 0 || b.y - floor > b.halfHeight + b.tumbleRadius) {
          continue;
        }
        const extent =
          b.halfHeight * Math.abs(Math.cos(b.angle)) + b.tumbleRadius * Math.abs(Math.sin(b.angle));
        if (b.y - extent <= floor) {
          const impact = -b.vy;
          b.y = floor + extent;
          if (impact > 1) {
            b.vy = impact * b.bounce;
            const slip = b.vz * axisX - b.vx * axisZ;
            b.spin += (slip / b.half - b.spin) * 0.2;
            const friction = Math.max(0.55, 1 - 0.08 * impact);
            b.vx *= friction;
            b.vz *= friction;
          } else {
            b.vy = 0;
            b.vx *= slideDrag;
            b.vz *= slideDrag;
            // Ground contact rocks the cube onto its nearest face before it sleeps.
            const face = Math.round(b.angle / (Math.PI / 2)) * (Math.PI / 2);
            b.spin = (b.spin + (face - b.angle) * 100 * h) * rollDrag;
            if (
              Math.abs(face - b.angle) < 0.025 &&
              b.vx * b.vx + b.vz * b.vz < 0.035 &&
              Math.abs(b.spin) < 0.65
            ) {
              b.angle = face;
              b.spin = 0;
              b.vx = 0;
              b.vz = 0;
              b.y = Math.abs(Math.cos(face)) > 0.5 ? b.halfHeight : b.tumbleRadius;
              this.records[b.slot + 3] = -(10 + b.expires);
              this.resting.push(b);
              asleep = true;
            }
          }
        }
      }
      this.writePose(b);
      if (asleep) {
        const last = this.moving.pop();
        if (last && last !== b) {
          this.moving[i] = last;
        }
        recordsChanged = true;
      }
    }
    if (recordsChanged) {
      this.material.needsUpdate = true;
    }
    this.pose.needsUpdate = true;
  }

  clearLooseBlocks(): void {
    for (const blocks of [this.moving, this.resting]) {
      for (const block of blocks) {
        this.startRebuild(block.slot, block.expires);
      }
      blocks.length = 0;
    }
    this.material.needsUpdate = true;
  }

  restore(): void {
    this.clearLooseBlocks();
    for (const slot of this.rebuilding) {
      this.records[slot + 3] = 0;
    }
    this.rebuilding.clear();
    this.nextCompletion = Infinity;
    this.material.needsUpdate = true;
  }

  dispose(): void {
    this.material.dispose();
    this.pose.dispose();
  }
}
