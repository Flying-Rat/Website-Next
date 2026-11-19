/** Table space: `x` across, `y` down toward the flippers. Nothing here is drawn. */

export const WIDTH = 360;
export const HEIGHT = 480;
export const BALL_RADIUS = 8;
export const BALLS = 3;
/** How far a bomb reaches from its middle. */
export const BLAST = 34;

/** The brick grid: square cells, half a ball across, filling the table's width. */
export const GRID = { cell: 8, columns: 45, rows: 14, top: 62 };
const BRICK_GAP = 1;
/** What is left of the ball's speed after each brick it breaks. */
const DRAG = 0.966;
const BOMBS = 4;
const HAZARD_PATCHES = 2;
const HAZARD_PATCH = { columns: 2, rows: 2 };
/** How far into the ball a hazard has to come, as a share of its radius, to take it. */
const HAZARD_REACH = 0.4;
/** The corners at the far end are cut off, so a ball there is sent back to the middle. */
export const CORNER = 46;
/**
 * Placed so that at rest the gap between the flipper tips is about one and a
 * half balls wide: a ball can always fall through it cleanly, never wedge in it.
 */
const PIVOT = { inset: 106, y: 410 };
/** A flipper tapers from its pivot to its tip; these are its half-widths there. */
export const FLIPPER = { length: 64, base: 8.5, tip: 4.5 };
/** Radians either side of level that a flipper hangs at rest and reaches when raised. */
const FLIPPER_SWING = 0.5;
const FLIPPER_SPEED = 20;
const FLIPPER_RETURN = 12;
/** Below this line a ball is past the flippers and gone. */
const DRAIN = 470;
const GRAVITY = 760;
const MAX_SPEED = 1250;
const STEP = 1 / 300;
/** How long a new ball takes to drop onto the table. */
export const SERVE_SECONDS = 0.7;
/** How far in from the side wall a new ball lands on its slope. */
const SERVE_INSET = 34;
const BOUNCE = { wall: 0.5, flipper: 0.25, bumper: 0.6 };
const BUMPER_KICK = 400;
const BLAST_KICK = 360;

export type Point = { x: number; y: number };
export type BrickKind = 'brick' | 'bomb' | 'hazard';
export type Brick = Point & {
  id: number;
  column: number;
  row: number;
  /** `x` and `y` are its middle. */
  width: number;
  height: number;
  kind: BrickKind;
  alive: boolean;
};
export type Flipper = {
  pivot: Point;
  rest: number;
  raised: number;
  angle: number;
  /** Radians a second it is turning at right now. */
  spin: number;
};
export type Bumper = Point & { id: number; radius: number };
export type Wall = { from: Point; to: Point };
export type Ball = Point & {
  vx: number;
  vy: number;
  /** Seconds until it lands on the table; until then it is dropping onto this spot. */
  wait: number;
};
export type Table = {
  bricks: Brick[];
  /** The same bricks by grid cell, `row * GRID.columns + column`; empty cells are missing. */
  cells: (Brick | undefined)[];
  flippers: Flipper[];
  bumpers: Bumper[];
  walls: Wall[];
  goal: Point & { radius: number };
  ball: Ball;
  /** Balls left, counting the one in play. */
  balls: number;
  phase: 'play' | 'won' | 'lost';
  /** Time carried over between calls, so physics always runs in equal steps. */
  carry: number;
  serves: number;
  /**
   * A new ball waits for the player before it drops, so a table nobody plays
   * stays as it is instead of draining ball after ball on its own.
   */
  held: boolean;
  /** Where a new ball lands on each side: on the slope above the flipper. */
  serveAt: [Point, Point];
};
export type TableEvent =
  | { type: 'break' | 'bomb' | 'hazard'; brick: Brick; at: Point }
  | { type: 'bumper'; bumper: Bumper; at: Point }
  /** `drop` is a held ball let go; `serve` is the moment it lands. */
  | { type: 'drain' | 'goal' | 'drop' | 'serve'; at: Point };

const corner = (x: number, y: number): Point => ({ x, y });

export function flipperTip(flipper: Flipper): Point {
  return {
    x: flipper.pivot.x + Math.cos(flipper.angle) * FLIPPER.length,
    y: flipper.pivot.y + Math.sin(flipper.angle) * FLIPPER.length,
  };
}

function shuffled<T>(items: T[], random: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function serve(table: Table) {
  // On one slope, then the other: it rolls down onto the flipper and along it
  // toward the gap, which leaves time to see it coming and press once.
  const at = table.serveAt[table.serves % 2];
  table.serves += 1;
  table.ball = { x: at.x, y: at.y, vx: 0, vy: 0, wait: SERVE_SECONDS };
  table.held = true;
}

/** Deals a table: the same walls and flippers every time, a new band of bricks. */
export function generate(random: () => number = Math.random): Table {
  const { cell: size, columns, rows, top } = GRID;
  // The band's near edge wanders, so no two tables open the same way.
  const phase = [random() * 6.3, random() * 6.3];
  const cells: (Brick | undefined)[] = [];
  const bricks: Brick[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column + 0.5) * size;
      const y = top + (row + 0.5) * size;
      const edge =
        top +
        rows * size -
        14 -
        12 * Math.sin(x * 0.034 + phase[0]) -
        6 * Math.sin(x * 0.11 + phase[1]);
      // Nothing in the cut-off corners, where the ball could never reach it.
      const cornered = Math.min(x, WIDTH - x) + y < CORNER + size * 1.5;
      if (y > edge || cornered) {
        continue;
      }
      const brick: Brick = {
        id: bricks.length,
        column,
        row,
        x,
        y,
        width: size - BRICK_GAP,
        height: size - BRICK_GAP,
        kind: 'brick',
        alive: true,
      };
      bricks.push(brick);
      cells[row * columns + column] = brick;
    }
  }

  // Small patches of hazard, well apart, so there is always a way round them.
  const patches: Brick[] = [];
  for (const origin of shuffled(bricks, random)) {
    if (patches.length === HAZARD_PATCHES) {
      break;
    }
    const patch: Brick[] = [];
    for (let row = 0; row < HAZARD_PATCH.rows; row++) {
      for (let column = 0; column < HAZARD_PATCH.columns; column++) {
        const brick = cells[(origin.row + row) * columns + origin.column + column];
        if (brick) {
          patch.push(brick);
        }
      }
    }
    const apart = patches.every((other) => Math.abs(other.column - origin.column) > 9);
    if (patch.length === HAZARD_PATCH.columns * HAZARD_PATCH.rows && apart && origin.row > 1) {
      patches.push(origin);
      for (const brick of patch) {
        brick.kind = 'hazard';
      }
    }
  }
  const bombs: Brick[] = [];
  for (const brick of shuffled(bricks, random)) {
    if (bombs.length === BOMBS) {
      break;
    }
    const apart = bombs.every(
      (other) => Math.hypot(other.x - brick.x, other.y - brick.y) > BLAST * 1.6,
    );
    if (brick.kind === 'brick' && brick.row > 0 && apart) {
      brick.kind = 'bomb';
      bombs.push(brick);
    }
  }

  const left = PIVOT.inset;
  const right = WIDTH - PIVOT.inset;
  // Each slope runs into the top of its flipper at the flipper's resting angle.
  // Ending it on the pivot instead leaves the flipper's round end standing proud
  // of it, and a slow ball comes to rest against that step for good.
  const slopeEnd = {
    x: left + Math.sin(FLIPPER_SWING) * FLIPPER.base,
    y: PIVOT.y - Math.cos(FLIPPER_SWING) * FLIPPER.base,
  };
  const slopeTop = slopeEnd.y - slopeEnd.x * Math.tan(FLIPPER_SWING);
  // Resting on the slope, a whisker clear of it.
  const lift = BALL_RADIUS + 0.5;
  const onSlope = slopeTop + SERVE_INSET * Math.tan(FLIPPER_SWING);
  const serveLeft = {
    x: SERVE_INSET + Math.sin(FLIPPER_SWING) * lift,
    y: onSlope - Math.cos(FLIPPER_SWING) * lift,
  };
  const walls: Wall[] = [
    { from: corner(CORNER, 0), to: corner(WIDTH - CORNER, 0) },
    { from: corner(0, CORNER), to: corner(CORNER, 0) },
    { from: corner(WIDTH - CORNER, 0), to: corner(WIDTH, CORNER) },
    { from: corner(0, CORNER), to: corner(0, HEIGHT) },
    { from: corner(WIDTH, CORNER), to: corner(WIDTH, HEIGHT) },
    { from: corner(0, slopeTop), to: corner(slopeEnd.x, slopeEnd.y) },
    { from: corner(WIDTH, slopeTop), to: corner(WIDTH - slopeEnd.x, slopeEnd.y) },
  ];
  const flippers: Flipper[] = [
    {
      pivot: { x: left, y: PIVOT.y },
      rest: FLIPPER_SWING,
      raised: -FLIPPER_SWING,
      angle: FLIPPER_SWING,
      spin: 0,
    },
    {
      pivot: { x: right, y: PIVOT.y },
      rest: Math.PI - FLIPPER_SWING,
      raised: Math.PI + FLIPPER_SWING,
      angle: Math.PI - FLIPPER_SWING,
      spin: 0,
    },
  ];
  const bumperY = 238 + random() * 24;
  const bumperOut = 68 + random() * 26;
  const bumpers: Bumper[] = [
    { id: 0, x: WIDTH / 2 - bumperOut, y: bumperY, radius: 15 },
    { id: 1, x: WIDTH / 2 + bumperOut, y: bumperY, radius: 15 },
  ];

  const table: Table = {
    bricks,
    cells,
    flippers,
    bumpers,
    walls,
    goal: { x: WIDTH / 2, y: 36, radius: 17 },
    ball: { x: 0, y: 0, vx: 0, vy: 0, wait: 0 },
    balls: BALLS,
    phase: 'play',
    carry: 0,
    serves: random() < 0.5 ? 0 : 1,
    held: true,
    serveAt: [serveLeft, { x: WIDTH - serveLeft.x, y: serveLeft.y }],
  };
  serve(table);
  return table;
}

/** Bounces the ball off a surface it has sunk into, given the way out and the surface's own speed. */
function bounce(
  ball: Ball,
  nx: number,
  ny: number,
  depth: number,
  spring: number,
  surfaceX = 0,
  surfaceY = 0,
) {
  ball.x += nx * depth;
  ball.y += ny * depth;
  const relX = ball.vx - surfaceX;
  const relY = ball.vy - surfaceY;
  const into = relX * nx + relY * ny;
  if (into < 0) {
    ball.vx = relX - (1 + spring) * into * nx + surfaceX;
    ball.vy = relY - (1 + spring) * into * ny + surfaceY;
  }
}

function nearestOnSegment(point: Point, from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const along = ((point.x - from.x) * dx + (point.y - from.y) * dy) / (dx * dx + dy * dy);
  const t = Math.max(0, Math.min(1, along));
  return { x: from.x + dx * t, y: from.y + dy * t };
}

/** Takes out a bomb and every brick in its reach; a bomb in reach goes off in turn. */
function explode(table: Table, first: Brick, events: TableEvent[]) {
  const fuse = [first];
  first.alive = false;
  for (let bomb = fuse.shift(); bomb; bomb = fuse.shift()) {
    events.push({ type: 'bomb', brick: bomb, at: { x: bomb.x, y: bomb.y } });
    for (const brick of table.bricks) {
      if (brick.alive && Math.hypot(brick.x - bomb.x, brick.y - bomb.y) <= BLAST) {
        brick.alive = false;
        if (brick.kind === 'bomb') {
          fuse.push(brick);
        } else {
          events.push({ type: 'break', brick, at: { x: brick.x, y: brick.y } });
        }
      }
    }
  }
}

function lose(table: Table) {
  table.balls -= 1;
  if (table.balls > 0) {
    serve(table);
  } else {
    table.phase = 'lost';
  }
}

function tick(table: Table, raised: boolean, events: TableEvent[]) {
  const { ball } = table;

  for (const flipper of table.flippers) {
    const target = raised ? flipper.raised : flipper.rest;
    const reach = (raised ? FLIPPER_SPEED : FLIPPER_RETURN) * STEP;
    const turn = Math.max(-reach, Math.min(reach, target - flipper.angle));
    flipper.angle += turn;
    flipper.spin = turn / STEP;
  }

  if (table.held) {
    if (!raised) {
      return;
    }
    table.held = false;
    events.push({ type: 'drop', at: { x: ball.x, y: ball.y } });
  }

  if (ball.wait > 0) {
    ball.wait -= STEP;
    if (ball.wait <= 0) {
      events.push({ type: 'serve', at: { x: ball.x, y: ball.y } });
    }
    return;
  }

  ball.vy += GRAVITY * STEP;
  // Kicks stack up; past this speed the ball would cross a brick in one step.
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > MAX_SPEED) {
    ball.vx *= MAX_SPEED / speed;
    ball.vy *= MAX_SPEED / speed;
  }
  ball.x += ball.vx * STEP;
  ball.y += ball.vy * STEP;

  for (const wall of table.walls) {
    const near = nearestOnSegment(ball, wall.from, wall.to);
    const gap = Math.hypot(ball.x - near.x, ball.y - near.y);
    if (gap < BALL_RADIUS && gap > 0) {
      bounce(
        ball,
        (ball.x - near.x) / gap,
        (ball.y - near.y) / gap,
        BALL_RADIUS - gap,
        BOUNCE.wall,
      );
    }
  }

  for (const flipper of table.flippers) {
    const tip = flipperTip(flipper);
    const near = nearestOnSegment(ball, flipper.pivot, tip);
    const gap = Math.hypot(ball.x - near.x, ball.y - near.y);
    const along = Math.hypot(near.x - flipper.pivot.x, near.y - flipper.pivot.y) / FLIPPER.length;
    const room = BALL_RADIUS + FLIPPER.base + (FLIPPER.tip - FLIPPER.base) * along;
    if (gap < room && gap > 0) {
      // The flipper turns about its pivot, so the spot the ball touches is moving.
      const surfaceX = -flipper.spin * (near.y - flipper.pivot.y);
      const surfaceY = flipper.spin * (near.x - flipper.pivot.x);
      const nx = (ball.x - near.x) / gap;
      const ny = (ball.y - near.y) / gap;
      bounce(ball, nx, ny, room - gap, BOUNCE.flipper, surfaceX, surfaceY);
    }
  }

  for (const bumper of table.bumpers) {
    const gap = Math.hypot(ball.x - bumper.x, ball.y - bumper.y);
    const room = BALL_RADIUS + bumper.radius;
    if (gap < room && gap > 0) {
      const nx = (ball.x - bumper.x) / gap;
      const ny = (ball.y - bumper.y) / gap;
      bounce(ball, nx, ny, room - gap, BOUNCE.bumper);
      // A bumper always throws the ball off, however gently it arrived.
      const away = ball.vx * nx + ball.vy * ny;
      if (away < BUMPER_KICK) {
        ball.vx += (BUMPER_KICK - away) * nx;
        ball.vy += (BUMPER_KICK - away) * ny;
      }
      events.push({ type: 'bumper', bumper, at: { x: ball.x, y: ball.y } });
    }
  }

  const { cell: size, columns, rows, top } = GRID;
  const firstColumn = Math.max(0, Math.floor((ball.x - BALL_RADIUS) / size));
  const lastColumn = Math.min(columns - 1, Math.floor((ball.x + BALL_RADIUS) / size));
  const firstRow = Math.max(0, Math.floor((ball.y - BALL_RADIUS - top) / size));
  const lastRow = Math.min(rows - 1, Math.floor((ball.y + BALL_RADIUS - top) / size));
  let broken = 0;
  for (let row = firstRow; row <= lastRow; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      const brick = table.cells[row * columns + column];
      if (!brick?.alive) {
        continue;
      }
      const nearX = Math.max(
        brick.x - brick.width / 2,
        Math.min(brick.x + brick.width / 2, ball.x),
      );
      const nearY = Math.max(
        brick.y - brick.height / 2,
        Math.min(brick.y + brick.height / 2, ball.y),
      );
      const gap = Math.hypot(ball.x - nearX, ball.y - nearY);
      // A hazard takes the ball only when it rolls onto it; grazing one is a near miss.
      if (gap >= (brick.kind === 'hazard' ? BALL_RADIUS * HAZARD_REACH : BALL_RADIUS)) {
        continue;
      }
      const at = { x: nearX, y: nearY };
      if (brick.kind === 'hazard') {
        brick.alive = false;
        events.push({ type: 'hazard', brick, at });
        lose(table);
        return;
      }
      broken += 1;
      if (brick.kind === 'bomb') {
        explode(table, brick, events);
        const away = Math.hypot(ball.x - brick.x, ball.y - brick.y) || 1;
        ball.vx += ((ball.x - brick.x) / away) * BLAST_KICK;
        ball.vy += ((ball.y - brick.y) / away) * BLAST_KICK;
      } else {
        brick.alive = false;
        events.push({ type: 'break', brick, at });
      }
    }
  }
  // The ball does not bounce off bricks this small; each one it breaks slows it.
  if (broken > 0) {
    const kept = DRAG ** broken;
    ball.vx *= kept;
    ball.vy *= kept;
  }

  const { goal } = table;
  if (Math.hypot(ball.x - goal.x, ball.y - goal.y) < goal.radius) {
    table.phase = 'won';
    events.push({ type: 'goal', at: { x: goal.x, y: goal.y } });
  } else if (ball.y > DRAIN) {
    events.push({ type: 'drain', at: { x: ball.x, y: ball.y } });
    lose(table);
  }
}

/** Moves the table on by `seconds`, with the flippers raised or not, and says what happened. */
export function advance(table: Table, seconds: number, raised: boolean): TableEvent[] {
  const events: TableEvent[] = [];
  table.carry += seconds;
  while (table.carry >= STEP && table.phase === 'play') {
    table.carry -= STEP;
    tick(table, raised, events);
  }
  if (table.phase !== 'play') {
    table.carry = 0;
  }
  return events;
}
