/**
 * The rules of the game, with nothing to draw them: a grid of blocks, the rats
 * standing on it, and what one blast does to both.
 *
 * Only blocks joined, face to face, to the bottom layer stay up. So a slab on a
 * single stem comes down whole when the stem is cut, with every rat on it and
 * onto every rat under it. That is how a few shots can clear many rats.
 */

/** How many blocks a rat is across: the map is built much finer than the rats on it. */
export const RAT = 3;
/** The map is laid out on a coarse plan, one rat to a cell, this many cells a side. */
const PLAN = 9;
/** Blocks along each side of the map, and how many it can be stacked high. */
export const SIZE = PLAN * RAT;
export const HEIGHT = PLAN * RAT;
/** How far from its centre a blast destroys blocks, in blocks. */
export const BLAST_RADIUS = 1.3 * RAT;
/** How many blocks thick a slab is; its stem is a full cell of the plan across. */
const SLAB = 2;

export type Cell = { x: number; y: number; z: number };
export type Point = Cell;
/** A rat is known by the empty cell its middle stands in. */
export type Rat = Cell & { id: number };
export type World = {
  solid: Uint8Array;
  rats: Rat[];
  /** How many rats the map started with. */
  total: number;
  shots: number;
};

export type Fall = {
  cells: Cell[];
  /** Levels it drops before it meets standing ground and breaks up; Infinity into the void. */
  drop: number;
};
export type Downed = {
  rat: Rat;
  /** Caught in the blast, gone down with its ground, or under a fall. */
  cause: 'blast' | 'fall' | 'crush';
  /** The index in `falls` of the fall that took it, if one did. */
  fall?: number;
  /** For a rat under a fall: how far above its feet the fall starts. */
  gap?: number;
};
export type Outcome = { blasted: Cell[]; falls: Fall[]; downed: Downed[] };

/** How many blocks a rat reaches to each side of the one under its middle. */
const FOOT = Math.floor(RAT / 2);

const NEIGHBOURS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const at = (x: number, y: number, z: number) => x + SIZE * (z + SIZE * y);
const inside = (x: number, y: number, z: number) =>
  x >= 0 && x < SIZE && y >= 0 && y < HEIGHT && z >= 0 && z < SIZE;

export function isSolid(world: World, x: number, y: number, z: number) {
  return inside(x, y, z) && world.solid[at(x, y, z)] === 1;
}

export function blocks(world: World): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < HEIGHT; y++) {
    for (let z = 0; z < SIZE; z++) {
      for (let x = 0; x < SIZE; x++) {
        if (world.solid[at(x, y, z)]) {
          cells.push({ x, y, z });
        }
      }
    }
  }
  return cells;
}

/** How high the ground stands in a column: the first empty level above the bottom. */
function groundAt(solid: Uint8Array, x: number, z: number) {
  let y = 0;
  while (y < HEIGHT && solid[at(x, y, z)]) {
    y++;
  }
  return y;
}

const planAt = (x: number, y: number, z: number) => x + PLAN * (z + PLAN * y);
const planInside = (x: number, y: number, z: number) =>
  x >= 0 && x < PLAN && y >= 0 && y < PLAN && z >= 0 && z < PLAN;

function planGround(plan: Uint8Array, x: number, z: number) {
  let y = 0;
  while (y < PLAN && plan[planAt(x, y, z)]) {
    y++;
  }
  return y;
}

/** How far the ground reaches from the middle of the plan, looking along `angle`. */
function shoreAt(angle: number, lobes: number) {
  return 3.9 + 0.5 * Math.sin(angle * 3 + lobes) + 0.3 * Math.sin(angle * 5 - lobes);
}

/**
 * A new map: a rough disc of ground, a few slabs on stems standing on it, rats on
 * and under the slabs and a couple in the open, and fewer shots than rats.
 */
export function generate(random: () => number = Math.random): World {
  const plan = new Uint8Array(PLAN * PLAN * PLAN);
  const whole = (low: number, high: number) => low + Math.floor(random() * (high - low + 1));
  const centre = (PLAN - 1) / 2;
  const lobes = random() * Math.PI * 2;

  for (let z = 0; z < PLAN; z++) {
    for (let x = 0; x < PLAN; x++) {
      const distance = Math.hypot(x - centre, z - centre);
      const angle = Math.atan2(z - centre, x - centre);
      const shore = shoreAt(angle, lobes);
      if (distance <= shore) {
        plan[planAt(x, 0, z)] = 1;
        if (distance <= shore - 1.6 + random() * 0.8) {
          plan[planAt(x, 1, z)] = 1;
        }
      }
    }
  }

  type Stack = { cap: Cell[]; under: Cell[] };
  const stacks: Stack[] = [];
  const stems: Cell[] = [];
  const wanted = whole(3, 4);
  for (let attempt = 0; attempt < 80 && stacks.length < wanted; attempt++) {
    const x = whole(1, PLAN - 2);
    const z = whole(1, PLAN - 2);
    const ground = planGround(plan, x, z);
    const apart = stems.every((stem) => Math.max(Math.abs(stem.x - x), Math.abs(stem.z - z)) >= 3);
    if (!ground || !apart) {
      continue;
    }
    const top = ground + whole(2, 4);
    const x0 = Math.max(0, x - whole(0, 2));
    const x1 = Math.min(PLAN - 1, x + whole(0, 2));
    const z0 = Math.max(0, z - whole(0, 2));
    const z1 = Math.min(PLAN - 1, z + whole(0, 2));
    if ((x1 - x0 + 1) * (z1 - z0 + 1) < 4 || top >= PLAN - 1) {
      continue;
    }
    const cap: Cell[] = [];
    let clear = true;
    for (let cz = z0; cz <= z1 && clear; cz++) {
      for (let cx = x0; cx <= x1 && clear; cx++) {
        // Nothing but its own stem may touch the slab, or it would hold it up too.
        for (let level = top - 1; level <= top + 1; level++) {
          const own = cx === x && cz === z && level === top - 1;
          clear &&= own || !plan[planAt(cx, level, cz)];
        }
        for (const [dx, , dz] of NEIGHBOURS) {
          const nx = cx + dx;
          const nz = cz + dz;
          const within = nx >= x0 && nx <= x1 && nz >= z0 && nz <= z1;
          clear &&= within || !planInside(nx, top, nz) || !plan[planAt(nx, top, nz)];
        }
        cap.push({ x: cx, y: top, z: cz });
      }
    }
    if (!clear) {
      continue;
    }
    for (let y = ground; y < top; y++) {
      plan[planAt(x, y, z)] = 1;
    }
    for (const cell of cap) {
      plan[planAt(cell.x, cell.y, cell.z)] = 1;
    }
    stems.push({ x, y: ground, z });
    stacks.push({
      cap,
      // Ground the slab hangs over, with room for a rat to stand between the two.
      under: cap
        .filter((cell) => !(cell.x === x && cell.z === z))
        .map((cell) => ({ x: cell.x, y: planGround(plan, cell.x, cell.z), z: cell.z }))
        .filter((cell) => cell.y > 0 && cell.y < top - 1),
    });
  }

  const rats: Rat[] = [];
  const taken = new Set<number>();
  const place = (cell: Cell | undefined) => {
    if (
      !cell ||
      taken.has(planAt(cell.x, cell.y, cell.z)) ||
      plan[planAt(cell.x, cell.y, cell.z)]
    ) {
      return false;
    }
    taken.add(planAt(cell.x, cell.y, cell.z));
    rats.push({ ...cell, id: rats.length });
    return true;
  };
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];

  for (const stack of stacks) {
    const onTop = stack.cap.map((cell) => ({ ...cell, y: cell.y + 1 }));
    place(pick(onTop));
    for (let more = whole(1, 2), tries = 0; more > 0 && tries < 12; tries++) {
      const below = stack.under.length > 0 && random() < 0.45;
      if (place(pick(below ? stack.under : onTop))) {
        more--;
      }
    }
  }

  const covered = new Set(
    stacks.flatMap((stack) => stack.cap.map((cell) => cell.x + PLAN * cell.z)),
  );
  const open: Cell[] = [];
  for (let z = 0; z < PLAN; z++) {
    for (let x = 0; x < PLAN; x++) {
      const ground = planGround(plan, x, z);
      const nearStem = stems.some((stem) => Math.abs(stem.x - x) + Math.abs(stem.z - z) <= 1);
      if (ground > 0 && ground <= 2 && !covered.has(x + PLAN * z) && !nearStem) {
        open.push({ x, y: ground, z });
      }
    }
  }
  let loose = 0;
  for (let wantedLoose = whole(1, 2), tries = 0; loose < wantedLoose && tries < 12; tries++) {
    if (open.length && place(pick(open))) {
      loose++;
    }
  }

  // One shot for each slab and each rat in the open, and one to spare when that
  // still leaves fewer shots than rats.
  const needed = stacks.length + loose;
  const shots = Math.max(1, Math.min(rats.length - 1, needed + (needed + 1 < rats.length ? 1 : 0)));

  // The plan, built out of blocks: every cell is RAT blocks a side. A slab is a
  // thin plate at the top of its cells, joined to the stem under its middle.
  const solid = new Uint8Array(SIZE * SIZE * HEIGHT);
  const thin = new Set(
    stacks.flatMap((stack) => stack.cap.map((cell) => planAt(cell.x, cell.y, cell.z))),
  );
  for (const stem of stems) {
    thin.delete(planAt(stem.x, planGround(plan, stem.x, stem.z) - 1, stem.z));
  }
  for (let i = 0; i < plan.length; i++) {
    if (!plan[i]) {
      continue;
    }
    const x = (i % PLAN) * RAT;
    const z = (Math.floor(i / PLAN) % PLAN) * RAT;
    const y = Math.floor(i / (PLAN * PLAN)) * RAT;
    for (let dy = thin.has(i) ? RAT - SLAB : 0; dy < RAT; dy++) {
      for (let dz = 0; dz < RAT; dz++) {
        for (let dx = 0; dx < RAT; dx++) {
          solid[at(x + dx, y + dy, z + dz)] = 1;
        }
      }
    }
  }

  // Detail the plan is too coarse for: a round shore and uneven ground. Cells
  // with a rat or a stem on them are left exactly as planned.
  const kept = new Set(rats.map((rat) => rat.x + PLAN * rat.z));
  for (const stem of stems) {
    kept.add(stem.x + PLAN * stem.z);
  }
  const waves = [random() * 6, random() * 6, random() * 6];
  for (let z = 0; z < SIZE; z++) {
    for (let x = 0; x < SIZE; x++) {
      const cx = Math.floor(x / RAT);
      const cz = Math.floor(z / RAT);
      if (kept.has(cx + PLAN * cz)) {
        continue;
      }
      const u = (x + 0.5) / RAT - 0.5 - centre;
      const v = (z + 0.5) / RAT - 0.5 - centre;
      const ashore = Math.hypot(u, v) <= shoreAt(Math.atan2(v, u), lobes) + 0.15;
      const planned = planGround(plan, cx, cz);
      if (planned <= 1 && Boolean(plan[planAt(cx, 0, cz)]) !== ashore) {
        for (let y = 0; y < RAT; y++) {
          solid[at(x, y, z)] = ashore ? 1 : 0;
        }
      }
      const top = groundAt(solid, x, z);
      const swell =
        Math.sin(x * 0.55 + waves[0]) +
        Math.sin(z * 0.6 + waves[1]) +
        Math.sin((x + z) * 0.35 + waves[2]) +
        (random() - 0.5) * 0.8;
      if (top > 0 && top % RAT === 0 && top <= 2 * RAT) {
        if (swell > 1.1 && !solid[at(x, top, z)]) {
          solid[at(x, top, z)] = 1;
        } else if (swell < -1.1) {
          solid[at(x, top - 1, z)] = 0;
        }
      }
    }
  }

  const middle = Math.floor(RAT / 2);
  const placed = rats.map((rat) => ({
    id: rat.id,
    x: rat.x * RAT + middle,
    y: rat.y * RAT,
    z: rat.z * RAT + middle,
  }));
  return { solid, rats: placed, total: placed.length, shots };
}

/** The standing blocks that are joined, face to face, to the bottom layer. */
function anchored(solid: Uint8Array) {
  const held = new Uint8Array(solid.length);
  const queue: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (solid[i]) {
      held[i] = 1;
      queue.push(i);
    }
  }
  while (queue.length) {
    const i = queue.pop() as number;
    const x = i % SIZE;
    const z = Math.floor(i / SIZE) % SIZE;
    const y = Math.floor(i / (SIZE * SIZE));
    for (const [dx, dy, dz] of NEIGHBOURS) {
      if (inside(x + dx, y + dy, z + dz)) {
        const next = at(x + dx, y + dy, z + dz);
        if (solid[next] && !held[next]) {
          held[next] = 1;
          queue.push(next);
        }
      }
    }
  }
  return held;
}

/** Fires one shot at `centre`, and changes the world to what is left standing. */
export function blast(world: World, centre: Point, radius = BLAST_RADIUS): Outcome {
  const { solid } = world;
  const blasted: Cell[] = [];
  const downed: Downed[] = [];
  const falls: Fall[] = [];
  world.shots = Math.max(0, world.shots - 1);

  const reach = Math.ceil(radius) + 1;
  for (let y = Math.floor(centre.y) - reach; y <= Math.floor(centre.y) + reach; y++) {
    for (let z = Math.floor(centre.z) - reach; z <= Math.floor(centre.z) + reach; z++) {
      for (let x = Math.floor(centre.x) - reach; x <= Math.floor(centre.x) + reach; x++) {
        const near =
          Math.hypot(x + 0.5 - centre.x, y + 0.5 - centre.y, z + 0.5 - centre.z) <= radius;
        if (near && isSolid(world, x, y, z)) {
          solid[at(x, y, z)] = 0;
          blasted.push({ x, y, z });
        }
      }
    }
  }

  let standing = world.rats.filter((rat) => {
    const caught =
      Math.hypot(rat.x + 0.5 - centre.x, rat.y + 0.3 * RAT - centre.y, rat.z + 0.5 - centre.z) <=
      radius + 0.35 * RAT;
    if (caught || !isSolid(world, rat.x, rat.y - 1, rat.z)) {
      downed.push({ rat, cause: caught ? 'blast' : 'fall' });
      return false;
    }
    return true;
  });

  const held = anchored(solid);
  const seen = new Uint8Array(solid.length);
  for (let start = 0; start < solid.length; start++) {
    if (!solid[start] || held[start] || seen[start]) {
      continue;
    }
    // Everything that hangs together comes down as one piece.
    const cells: Cell[] = [];
    const queue = [start];
    seen[start] = 1;
    while (queue.length) {
      const i = queue.pop() as number;
      const cell = {
        x: i % SIZE,
        y: Math.floor(i / (SIZE * SIZE)),
        z: Math.floor(i / SIZE) % SIZE,
      };
      cells.push(cell);
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const next = at(cell.x + dx, cell.y + dy, cell.z + dz);
        if (
          inside(cell.x + dx, cell.y + dy, cell.z + dz) &&
          solid[next] &&
          !held[next] &&
          !seen[next]
        ) {
          seen[next] = 1;
          queue.push(next);
        }
      }
    }

    let drop = Infinity;
    const lowest = new Map<number, number>();
    for (const cell of cells) {
      const column = cell.x + SIZE * cell.z;
      lowest.set(column, Math.min(lowest.get(column) ?? Infinity, cell.y));
      for (let y = cell.y - 1; y >= 0; y--) {
        if (held[at(cell.x, y, cell.z)]) {
          drop = Math.min(drop, cell.y - y - 1);
          break;
        }
      }
    }
    const index = falls.length;
    const riding = new Set(cells.map((cell) => at(cell.x, cell.y, cell.z)));
    standing = standing.filter((rat) => {
      if (riding.has(at(rat.x, rat.y - 1, rat.z))) {
        downed.push({ rat, cause: 'fall', fall: index });
        return false;
      }
      // A rat is RAT blocks across: anything coming down over any of them lands on it.
      let above = Infinity;
      for (let dz = -FOOT; dz <= FOOT; dz++) {
        for (let dx = -FOOT; dx <= FOOT; dx++) {
          const from = inside(rat.x + dx, 0, rat.z + dz)
            ? lowest.get(rat.x + dx + SIZE * (rat.z + dz))
            : undefined;
          if (from !== undefined && from > rat.y) {
            above = Math.min(above, from);
          }
        }
      }
      if (above < Infinity) {
        downed.push({ rat, cause: 'crush', fall: index, gap: above - rat.y });
        return false;
      }
      return true;
    });
    falls.push({ cells, drop });
  }
  for (const fall of falls) {
    for (const cell of fall.cells) {
      solid[at(cell.x, cell.y, cell.z)] = 0;
    }
  }

  world.rats = standing;
  return { blasted, falls, downed };
}

/**
 * The first block a ray meets, and where it meets it, in block coordinates.
 * `direction` must be a unit vector.
 */
export function trace(world: World, origin: Point, direction: Point) {
  const STEP = 0.1;
  // Enough to reach the far side of the map from an eye well outside it.
  const far = SIZE * 9;
  for (let t = 0; t < far; t += STEP) {
    const x = origin.x + direction.x * t;
    const y = origin.y + direction.y * t;
    const z = origin.z + direction.z * t;
    if (isSolid(world, Math.floor(x), Math.floor(y), Math.floor(z))) {
      return {
        cell: { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) },
        point: { x, y, z },
      };
    }
  }
  return null;
}
