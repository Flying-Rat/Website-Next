import { BufferAttribute, InstancedBufferGeometry } from 'three';

/**
 * Builders for everything the scene uploads to the GPU. All of it is created once;
 * nothing here runs per frame.
 */

/**
 * A unit column: eight corners shared by five faces, and no normals (the fragment
 * shader derives them). The underside is never seen, so it is not drawn at all.
 * That is 8 vertices and 10 triangles per instance against a stock box's 24 and 12.
 */
export function createColumnGeometry(): InstancedBufferGeometry {
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
  ]);
  return geometry;
}

/**
 * Centres (x, z pairs) of the grid cells that fall inside a disc: one per column.
 * @param columns cells across the disc's diameter
 */
export function createIslandCells(columns: number, radius: number): Float32Array {
  const cellSize = (radius * 2) / columns;
  const cells: number[] = [];
  for (let row = 0; row < columns; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column + 0.5) * cellSize - radius;
      const z = (row + 0.5) * cellSize - radius;
      if (Math.hypot(x, z) <= radius) {
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
 * Props are boxes that are not terrain: trees standing on columns, and the blocks
 * that make up clouds. They share one instanced draw call, so both kinds use the
 * same two per-instance records:
 *
 *   anchor: x, z, cloud index  - a tree's grid cell, or a block's offset from its
 *                                cloud's centre; the index is -1 for trees
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

export function createProps(
  cells: Float32Array,
  cellSize: number,
  treeDensity: number,
  cloudCount: number,
  blocksPerCloud: number,
): PropInstances {
  const anchors: number[] = [];
  const boxes: number[] = [];
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
