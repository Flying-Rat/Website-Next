import { BufferAttribute, InstancedBufferGeometry } from 'three';

import { BRIDGE, COLUMN_BASE, COLUMN_RELIEF, RAVINE } from './shapeSceneConstants';

/**
 * Builders for everything the scene uploads to the GPU. All of it is created once;
 * nothing here runs per frame.
 */

/**
 * Eight corners shared by all faces; the shader derives the normals. The last
 * six optional indices close the underside while loose blocks can overturn.
 */
export function createColumnGeometry(closed = false): InstancedBufferGeometry {
  // Corner i sits at (bit 0 ? +x : -x, bit 1 ? +y : -y, bit 2 ? +z : -z).
  const corners = new Float32Array(8 * 3);
  for (let i = 0; i < 8; i++) {
    corners[i * 3] = i & 1 ? 0.5 : -0.5;
    corners[i * 3 + 1] = i & 2 ? 0.5 : -0.5;
    corners[i * 3 + 2] = i & 4 ? 0.5 : -0.5;
  }
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(corners, 3));
  // Two counter-clockwise triangles per face, as seen from outside the box.
  // prettier-ignore
  geometry.setIndex([
    2, 6, 7, 2, 7, 3, // top
    1, 3, 7, 1, 7, 5, // +x
    0, 4, 6, 0, 6, 2, // -x
    4, 5, 7, 4, 7, 6, // +z
    0, 2, 3, 0, 3, 1, // -z
    ...(closed ? [0, 1, 5, 0, 5, 4] : []), // underside of airborne debris
  ]);
  return geometry;
}

/**
 * Centres of the island columns. The open ravine needs no terrain instances.
 * @param columns cells across the disc's diameter
 */
export function createIslandCells(columns: number, radius: number): Float32Array {
  const cellSize = (radius * 2) / columns;
  const cells: number[] = [];
  for (let row = 0; row < columns; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column + 0.5) * cellSize - radius;
      const z = (row + 0.5) * cellSize - radius;
      const dz = z - BRIDGE.z;
      const channel = x - BRIDGE.x - RAVINE.slope * dz - RAVINE.bend * Math.abs(dz);
      if (x * x + z * z <= radius * radius && Math.abs(channel) >= RAVINE.halfWidth) {
        cells.push(x, z);
      }
    }
  }
  return new Float32Array(cells);
}

/**
 * A copy of `cells` sorted nearest-first for a camera standing at `azimuth` around
 * the island. Drawn in that order, columns hidden behind nearer ones fail the depth
 * test before they are shaded.
 */
export function sortCellsNearestFirst(cells: Float32Array, azimuth: number): Float32Array {
  const count = cells.length / 2;
  const towardX = Math.sin(azimuth);
  const towardZ = Math.cos(azimuth);
  const nearness = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    nearness[i] = cells[i * 2] * towardX + cells[i * 2 + 1] * towardZ;
  }
  const order = Uint32Array.from(nearness, (_, i) => i).toSorted(
    (a, b) => nearness[b] - nearness[a],
  );
  const sorted = new Float32Array(cells.length);
  for (let i = 0; i < count; i++) {
    sorted[i * 2] = cells[order[i] * 2];
    sorted[i * 2 + 1] = cells[order[i] * 2 + 1];
  }
  return sorted;
}

/** Start positions and per-mote seeds for motes scattered through a cylinder. */
export function createMotes(
  count: number,
  radius: number,
  height: number,
): { positions: Float32Array; seeds: Float32Array } {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // sqrt keeps the scatter even across the disc instead of bunching at its centre.
    const distance = Math.sqrt(Math.random()) * radius;
    positions[i * 3] = Math.cos(angle) * distance;
    positions[i * 3 + 1] = Math.random() * height;
    positions[i * 3 + 2] = Math.sin(angle) * distance;
    seeds[i] = Math.random();
  }
  return { positions, seeds };
}

/**
 * Trees, cloud blocks and bridge parts share a single batch of instanced boxes.
 *   anchor: x, z, kind  - nonnegative selects a cloud, -1 anchors a tree to a
 *                         terrain cell, and values below -1 encode fixed box depth.
 *   box:    width, height, base, tint  - `base` lifts the box above its anchor
 */
export interface PropInstances {
  anchors: Float32Array;
  boxes: Float32Array;
  count: number;
}

export const PROP_TINT = { trunk: 0, crown: 1, accentCrown: 2, cloud: 3 } as const;

/**
 * Trees on a share of the island's cells, gathered into groves. Each is a trunk
 * and a two-tier crown: three boxes. Whether a tree actually shows is decided every
 * frame in the shader, from how high and how open its cell currently is, so these
 * are candidate sites rather than a fixed forest.
 */
function addTrees(
  anchors: number[],
  boxes: number[],
  cells: Float32Array,
  cellSize: number,
  density: number,
): void {
  for (let i = 0; i < cells.length; i += 2) {
    const x = cells[i];
    const z = cells[i + 1];
    if (Math.abs(x - BRIDGE.x) < BRIDGE.halfSpan + 0.7 && Math.abs(z - BRIDGE.z) < 0.8) {
      continue;
    }
    // A slow pattern over the ground thickens some areas into groves and clears others.
    const grove = Math.sin(x * 0.9 + 1.3) * Math.sin(z * 1.1 + 4) + Math.sin(x * 0.5 - z * 0.7);
    if (Math.random() >= density * Math.max(0, 1 + grove * 1.4)) {
      continue;
    }
    const scale = cellSize * (0.8 + Math.random() * 0.45);
    const tint = Math.random() < 0.05 ? PROP_TINT.accentCrown : PROP_TINT.crown;
    const trunkHeight = scale * 0.5;
    const lowerHeight = scale * 0.8;
    anchors.push(x, z, -1, x, z, -1, x, z, -1);
    boxes.push(scale * 0.3, trunkHeight, 0, PROP_TINT.trunk);
    boxes.push(scale * 1.25, lowerHeight, trunkHeight, tint);
    boxes.push(scale * 0.75, scale * 0.75, trunkHeight + lowerHeight, tint);
  }
}

/** A cloud: a loose pile of blocks, larger and taller toward its middle. */
function addCloud(anchors: number[], boxes: number[], index: number, blocks: number): void {
  for (let i = 0; i < blocks; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Stretched along x, so clouds read as banks rather than balls.
    const distance = Math.random() ** 0.8;
    const middle = 1 - distance;
    anchors.push(Math.cos(angle) * distance * 1.15, Math.sin(angle) * distance * 0.7, index);
    boxes.push(
      0.4 + middle * 0.55 + Math.random() * 0.18,
      0.2 + middle * 0.34 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.18,
      PROP_TINT.cloud,
    );
  }
}

/** Fixed boxes encode their depth below -1 in the unused cloud-index slot. */
function addBridge(anchors: number[], boxes: number[]): void {
  const deck = COLUMN_BASE + BRIDGE.bankRelief * COLUMN_RELIEF;
  const span = BRIDGE.halfSpan * 2;
  function box(
    x: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    base: number,
    tint: number,
  ) {
    anchors.push(BRIDGE.x + x, BRIDGE.z + z, -1 - depth);
    boxes.push(width, height, deck + base, tint);
  }

  const planks = 11;
  const pitch = span / planks;
  for (const side of [-1, 1]) {
    for (let i = 0; i < planks; i++) {
      const x = (i + 0.5) * pitch - BRIDGE.halfSpan;
      box(x, side * 0.34, pitch, 0.16, 0.15, -0.16, PROP_TINT.trunk);
      box(x, side * 0.4, pitch, 0.09, 0.1, 0.48, PROP_TINT.accentCrown);
    }
    for (const x of [-1.38, -0.46, 0.46, 1.38]) {
      box(x, side * 0.4, 0.11, 0.42, 0.11, 0.07, PROP_TINT.trunk);
    }
  }
  for (let i = 0; i < planks; i++) {
    for (const z of [-0.31, 0, 0.31]) {
      box(
        (i + 0.5) * pitch - BRIDGE.halfSpan,
        z,
        pitch - 0.018,
        0.12,
        0.31,
        -0.015,
        PROP_TINT.crown,
      );
    }
  }
}

export function createProps(
  cells: Float32Array,
  cellSize: number,
  treeDensity: number,
  cloudCount: number,
  blocksPerCloud: number,
): PropInstances {
  const anchors: number[] = [];
  const boxes: number[] = [];
  addBridge(anchors, boxes);
  addTrees(anchors, boxes, cells, cellSize, treeDensity);
  for (let cloud = 0; cloud < cloudCount; cloud++) {
    addCloud(anchors, boxes, cloud, blocksPerCloud);
  }
  return {
    anchors: new Float32Array(anchors),
    boxes: new Float32Array(boxes),
    count: anchors.length / 3,
  };
}
