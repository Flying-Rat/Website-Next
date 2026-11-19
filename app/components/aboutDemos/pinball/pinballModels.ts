import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  RingGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import {
  BALL_RADIUS,
  CORNER,
  FLIPPER,
  HEIGHT,
  type Point,
  type Table,
  WIDTH,
} from './pinballTable';

export type PinballTones = { ink: string; paper: string; accent: string };

/** How thick the table is, and so how far below its surface the floor lies. */
export const DECK = 16;
/** The tallest a brick stands; the fit of the view allows for it. */
export const BRICK_TALL = 11;
const RAIL = { radius: 4.5, height: 5 };
const FLIPPER_TALL = 11;
const BUMPER_TALL = 13;
/** The table is drawn this much wider than its walls, so the rails stand on it. */
const MARGIN = RAIL.radius * 2 + 2;
/** Pixels of the printed playfield per table unit. */
const PRINT_SCALE = 3;
/** The floor's grid: its spacing, and how far from the middle it runs before it is gone. */
const FLOOR = { cell: 40, reach: 460 };

/** The table's `x` and `y` as a place on its surface, with the middle of the table at the origin. */
export function onTable(x: number, y: number, lift = 0) {
  return new Vector3(x - WIDTH / 2, lift, y - HEIGHT / 2);
}

const FADE_VERTEX = /* glsl */ `
  varying vec2 vPlane;

  void main() {
    vPlane = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Full strength out to `uSolid` of the way and gone by `uReach`, so nothing on
// the floor ends in a hard edge.
const FADE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uReach;
  uniform float uSolid;
  varying vec2 vPlane;

  void main() {
    float away = length(vPlane) / uReach;
    gl_FragColor = vec4(uColor, uOpacity * (1.0 - smoothstep(uSolid, 1.0, away)));
    #include <colorspace_fragment>
  }
`;

function fading(reach: number, solid: number) {
  return new ShaderMaterial({
    vertexShader: FADE_VERTEX,
    fragmentShader: FADE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new Color() },
      uOpacity: { value: 0 },
      uReach: { value: reach },
      uSolid: { value: solid },
    },
  });
}

function wash(material: ShaderMaterial, color: Color, opacity: number) {
  material.uniforms.uColor.value.copy(color);
  material.uniforms.uOpacity.value = opacity;
}

function luminance(color: Color) {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

/** Part of the way from one colour to another, measured as the eye sees it. */
function tint(from: Color, to: Color, amount: number) {
  return from
    .clone()
    .convertLinearToSRGB()
    .lerp(to.clone().convertLinearToSRGB(), amount)
    .convertSRGBToLinear();
}

function css(color: Color, alpha = 1) {
  const { r, g, b } = color.clone().convertLinearToSRGB();
  return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)} / ${alpha})`;
}

/** Every corner of a closed outline moved `by` toward its inside; the outline runs clockwise on screen. */
function inset(points: Point[], by: number): Point[] {
  const count = points.length;
  const edge = (i: number) => {
    const from = points[i];
    const to = points[(i + 1) % count];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const nx = -(to.y - from.y) / length;
    const ny = (to.x - from.x) / length;
    return { x: from.x + nx * by, y: from.y + ny * by, dx: to.x - from.x, dy: to.y - from.y };
  };
  return points.map((_, i) => {
    const a = edge((i + count - 1) % count);
    const b = edge(i);
    const cross = a.dx * b.dy - a.dy * b.dx;
    const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / cross;
    return { x: a.x + a.dx * t, y: a.y + a.dy * t };
  });
}

/**
 * A flipper's outline lying along +X from its pivot: round at both ends, tapering
 * between them. `shrink` draws it that much smaller all round.
 */
function flipperOutline<T extends Path>(path: T, shrink: number) {
  const base = FLIPPER.base - shrink;
  const tip = FLIPPER.tip - shrink;
  // Where the straight sides meet each round end.
  const meet = Math.PI / 2 - Math.asin((base - tip) / FLIPPER.length);
  path.moveTo(Math.cos(meet) * base, Math.sin(meet) * base);
  path.absarc(FLIPPER.length, 0, tip, meet, -meet, true);
  path.absarc(0, 0, base, -meet, meet, true);
  return path;
}

/** Laid flat with its bottom at `bottom`; a shape is drawn upright and then turned over. */
function slab(shape: Shape, tall: number, bevel: number, bottom = 0) {
  return new ExtrudeGeometry(shape, {
    depth: tall - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 3,
    curveSegments: 24,
  })
    .rotateX(-Math.PI / 2)
    .translate(0, bottom + bevel, 0);
}

/** Every shape and material on the table. */
export class PinballModels {
  /** Bricks and debris take their colour from each instance; these stay white. */
  readonly stone = new MeshStandardMaterial({ roughness: 0.45 });
  readonly debris = new MeshStandardMaterial({ roughness: 0.5 });
  readonly bomb = new MeshStandardMaterial({ roughness: 0.38 });
  readonly hazard = new MeshStandardMaterial({ roughness: 0.3 });
  /** The tones the game paints instances with. */
  readonly stoneTone = new Color();
  readonly hazardTone = new Color();
  readonly accentTone = new Color();
  readonly ballMaterial = new MeshStandardMaterial({ metalness: 1, roughness: 0.07 });
  /** The blur of a fast ball: copies of it, fainter the further back. */
  readonly ghost = new MeshStandardMaterial({
    metalness: 1,
    roughness: 0.07,
    transparent: true,
    depthWrite: false,
  });
  readonly glow = new MeshStandardMaterial({ roughness: 0.35 });
  private readonly print = new MeshStandardMaterial({ roughness: 0.62 });
  private readonly side = new MeshStandardMaterial({ roughness: 0.7 });
  private readonly chrome = new MeshStandardMaterial({ metalness: 1, roughness: 0.2 });
  private readonly plastic = new MeshStandardMaterial({ roughness: 0.28 });
  private readonly rubber = new MeshStandardMaterial({ roughness: 0.75 });
  private readonly hole = new MeshBasicMaterial();
  private readonly caps: MeshStandardMaterial[] = [];
  private readonly grid = fading(FLOOR.reach, 0.35);
  private readonly tableShadow = fading(1, 0.5);
  private readonly ballShadow = fading(1, 0.15);

  private readonly printCanvas = document.createElement('canvas');
  private readonly printTexture = new CanvasTexture(this.printCanvas);
  private tones: { ink: Color; paper: Color; accent: Color; light: boolean } | null = null;

  readonly ringShape = new RingGeometry(0.86, 1, 64).rotateX(-Math.PI / 2);
  /** A unit block standing on its origin, and a four-sided spike the same size. */
  readonly cell = new RoundedBoxGeometry(1, 1, 1, 2, 0.12).translate(0, 0.5, 0);
  readonly spike = new ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0);
  readonly sphere = new SphereGeometry(1, 48, 32);
  private readonly drum = new CylinderGeometry(1, 1, 1, 48);
  private readonly tube = new CylinderGeometry(1, 1, 1, 24).rotateZ(Math.PI / 2);
  private readonly disc = new CircleGeometry(1, 48).rotateX(-Math.PI / 2);
  private readonly torus = new TorusGeometry(1, 0.11, 16, 72).rotateX(Math.PI / 2);
  private readonly own: BufferGeometry[] = [];

  constructor(anisotropy: number) {
    this.printCanvas.width = Math.round((WIDTH + MARGIN * 2) * PRINT_SCALE);
    this.printCanvas.height = Math.round((HEIGHT + MARGIN) * PRINT_SCALE);
    this.printTexture.colorSpace = SRGBColorSpace;
    this.printTexture.anisotropy = anisotropy;
    // The slab's top takes its texture coordinates from the outline, in table
    // units about the middle; this maps them onto the canvas.
    this.printTexture.repeat.set(1 / (WIDTH + MARGIN * 2), 1 / (HEIGHT + MARGIN));
    this.printTexture.offset.set(
      (WIDTH / 2 + MARGIN) / (WIDTH + MARGIN * 2),
      HEIGHT / 2 / (HEIGHT + MARGIN),
    );
    this.print.map = this.printTexture;

    this.ghost.color = this.ballMaterial.color;
    // The studio is lit softly for the table; the ball has to read as polished
    // steel against a dark table, so it reflects it harder.
    this.ballMaterial.envMapIntensity = 2.6;
    this.ghost.envMapIntensity = 2.6;
  }

  private part(
    parent: Group,
    geometry: BufferGeometry,
    material: Material,
    size: [number, number, number],
    at: [number, number, number],
  ) {
    const mesh = new Mesh(geometry, material);
    mesh.scale.set(...size);
    mesh.position.set(...at);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /** The slab the game is played on, the floor under it, and the rails along its walls. */
  table(table: Table) {
    const group = new Group();

    const outline = new Shape();
    const cut = CORNER - MARGIN * 0.41;
    const corners = [
      [-MARGIN, cut],
      [cut, -MARGIN],
      [WIDTH - cut, -MARGIN],
      [WIDTH + MARGIN, cut],
      [WIDTH + MARGIN, HEIGHT],
      [-MARGIN, HEIGHT],
    ];
    for (const [index, [x, y]] of corners.entries()) {
      const point = [x - WIDTH / 2, HEIGHT / 2 - y] as const;
      if (index === 0) {
        outline.moveTo(...point);
      } else {
        outline.lineTo(...point);
      }
    }
    const deck = slab(outline, DECK, 1.5, -DECK);
    this.own.push(deck);
    const top = new Mesh(deck, [this.print, this.side]);
    top.receiveShadow = true;
    group.add(top);

    const lines: number[] = [];
    const end = Math.floor(FLOOR.reach / FLOOR.cell) * FLOOR.cell;
    for (let at = -end; at <= end; at += FLOOR.cell) {
      lines.push(at, 0, -end, at, 0, end, -end, 0, at, end, 0, at);
    }
    const gridLines = new BufferGeometry();
    gridLines.setAttribute('position', new Float32BufferAttribute(lines, 3));
    this.own.push(gridLines);
    const grid = new LineSegments(gridLines, this.grid);
    grid.position.y = -DECK;
    const shadow = new Mesh(this.disc, this.tableShadow);
    shadow.position.y = -DECK - 0.5;
    shadow.scale.set(WIDTH * 0.8, 1, HEIGHT * 0.74);
    group.add(shadow, grid);

    const middle = { x: WIDTH / 2, y: HEIGHT / 2 };
    const joints = new Set<string>();
    for (const { from, to } of table.walls) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy);
      // The rail stands just outside the line the ball bounces off.
      let nx = -dy / length;
      let ny = dx / length;
      if (nx * (middle.x - (from.x + to.x) / 2) + ny * (middle.y - (from.y + to.y) / 2) > 0) {
        nx = -nx;
        ny = -ny;
      }
      const shift = { x: nx * RAIL.radius, y: ny * RAIL.radius };
      const rail = this.part(
        group,
        this.tube,
        this.chrome,
        [length, RAIL.radius, RAIL.radius],
        [0, 0, 0],
      );
      rail.position.copy(
        onTable((from.x + to.x) / 2 + shift.x, (from.y + to.y) / 2 + shift.y, RAIL.height),
      );
      rail.rotation.y = -Math.atan2(dy, dx);
      for (const point of [from, to]) {
        const key = `${Math.round(point.x + shift.x)},${Math.round(point.y + shift.y)}`;
        if (!joints.has(key) && point.y < HEIGHT) {
          joints.add(key);
          const joint = this.part(
            group,
            this.sphere,
            this.chrome,
            [RAIL.radius, RAIL.radius, RAIL.radius],
            [0, 0, 0],
          );
          joint.position.copy(onTable(point.x + shift.x, point.y + shift.y, RAIL.height));
        }
      }
    }
    return group;
  }

  /** A pop bumper. Its cap has a material of its own, so it can light up alone. */
  bumper(radius: number) {
    const group = new Group();
    const cap = new MeshStandardMaterial({ roughness: 0.3 });
    if (this.tones) {
      cap.color.copy(this.tones.accent);
      cap.emissive.copy(this.tones.accent);
    }
    this.caps.push(cap);
    this.part(group, this.drum, this.chrome, [radius + 3, 2.4, radius + 3], [0, 1.2, 0]);
    this.part(
      group,
      this.drum,
      this.plastic,
      [radius - 1, BUMPER_TALL - 4, radius - 1],
      [0, BUMPER_TALL / 2, 0],
    );
    this.part(group, this.drum, cap, [radius, 3.4, radius], [0, BUMPER_TALL - 1.5, 0]);
    const dome = this.part(group, this.sphere, this.chrome, [4, 3, 4], [0, BUMPER_TALL, 0]);
    dome.castShadow = false;
    return { group, cap };
  }

  /** A flipper lying along +X from its pivot, which is its origin. */
  flipper() {
    const group = new Group();
    // The outline grows by the bevel: the body ends up just inside the rubber
    // band, which stands proud of it all round at the ball's height.
    const body = slab(flipperOutline(new Shape(), 1.6), FLIPPER_TALL, 1.6);
    const band = flipperOutline(new Shape(), 0);
    band.holes.push(flipperOutline(new Path(), 2.2));
    const rubber = slab(band, 5, 0.6, 2.4);
    this.own.push(body, rubber);
    this.part(group, body, this.plastic, [1, 1, 1], [0, 0, 0]);
    this.part(group, rubber, this.rubber, [1, 1, 1], [0, 0, 0]);
    this.part(group, this.drum, this.chrome, [3.6, 1.4, 3.6], [0, FLIPPER_TALL + 0.7, 0]);
    return group;
  }

  ball() {
    const ball = new Mesh(this.sphere, this.ballMaterial);
    ball.scale.setScalar(BALL_RADIUS);
    ball.castShadow = true;
    return ball;
  }

  /** A disc of radius 1, sized by whoever places it. */
  ballBlob() {
    return new Mesh(this.disc, this.ballShadow);
  }

  /** `ring` is the game's to animate. */
  goal(radius: number) {
    const group = new Group();
    const mouth = new Mesh(this.disc, this.hole);
    mouth.scale.setScalar(radius);
    mouth.position.y = 0.2;
    const ring = new Mesh(this.torus, this.glow);
    ring.scale.setScalar(radius + 1.5);
    ring.position.y = 0.6;
    group.add(mouth, ring);
    return { group, ring };
  }

  /** Paints the playfield: guide lines, the halo round the goal, chevrons pointing at the bricks. */
  paint(table: Table) {
    const tones = this.tones;
    const context = this.printCanvas.getContext('2d');
    if (!tones || !context) {
      return;
    }
    const { ink, paper, accent, light } = tones;
    const { width, height } = this.printCanvas;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = css(tint(paper, ink, light ? 0.05 : 0.075));
    context.fillRect(0, 0, width, height);
    context.setTransform(
      PRINT_SCALE,
      0,
      0,
      PRINT_SCALE,
      MARGIN * PRINT_SCALE,
      MARGIN * PRINT_SCALE,
    );

    const pool = context.createRadialGradient(
      WIDTH / 2,
      HEIGHT * 0.38,
      20,
      WIDTH / 2,
      HEIGHT * 0.45,
      HEIGHT * 0.62,
    );
    pool.addColorStop(0, css(light ? paper : ink, light ? 0.55 : 0.05));
    pool.addColorStop(1, css(light ? ink : paper, light ? 0.04 : 0.25));
    context.fillStyle = pool;
    context.fillRect(-MARGIN, -MARGIN, WIDTH + MARGIN * 2, HEIGHT + MARGIN);

    // The last two walls are the slopes down to the flippers.
    const [leftSlope, rightSlope] = table.walls.slice(-2);
    const field = inset(
      [
        { x: 0, y: CORNER },
        { x: CORNER, y: 0 },
        { x: WIDTH - CORNER, y: 0 },
        { x: WIDTH, y: CORNER },
        rightSlope.from,
        rightSlope.to,
        leftSlope.to,
        leftSlope.from,
      ],
      12,
    );
    context.lineWidth = 0.9;
    context.strokeStyle = css(ink, light ? 0.16 : 0.14);
    context.beginPath();
    // Open across the flippers: the line follows the walls and the slopes only.
    for (const [index, point] of [...field.slice(6), ...field.slice(0, 6)].entries()) {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    }
    context.stroke();

    // Under the bricks, so a dug path still shows the table's grid.
    context.lineWidth = 0.5;
    context.strokeStyle = css(ink, light ? 0.13 : 0.12);
    context.beginPath();
    for (const brick of table.bricks) {
      context.rect(
        brick.x - brick.width / 2,
        brick.y - brick.height / 2,
        brick.width,
        brick.height,
      );
    }
    context.stroke();

    const { goal } = table;
    context.lineWidth = 1.2;
    for (const [reach, alpha] of [
      [goal.radius + 9, 0.55],
      [goal.radius + 16, 0.22],
    ] as const) {
      context.strokeStyle = css(accent, alpha);
      context.beginPath();
      context.arc(goal.x, goal.y, reach, 0, Math.PI * 2);
      context.stroke();
    }

    for (const bumper of table.bumpers) {
      context.strokeStyle = css(ink, light ? 0.14 : 0.12);
      context.lineWidth = 0.8;
      context.beginPath();
      context.arc(bumper.x, bumper.y, bumper.radius + 10, 0, Math.PI * 2);
      context.stroke();
    }

    context.lineWidth = 2.2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const y = 330 - i * 20;
      context.strokeStyle = css(
        i === 2 ? accent : ink,
        i === 2 ? 0.7 : light ? 0.14 + i * 0.06 : 0.12 + i * 0.06,
      );
      context.beginPath();
      context.moveTo(WIDTH / 2 - 11, y + 7);
      context.lineTo(WIDTH / 2, y - 3);
      context.lineTo(WIDTH / 2 + 11, y + 7);
      context.stroke();
    }
    this.printTexture.needsUpdate = true;
  }

  /** Returns whether the page is the light one. */
  setTones(tones: PinballTones) {
    const ink = new Color(tones.ink);
    const paper = new Color(tones.paper);
    const accent = new Color(tones.accent);
    const light = luminance(ink) < luminance(paper);
    this.tones = { ink, paper, accent, light };
    const toInk = (amount: number) => tint(paper, ink, amount);

    // The table stays close to the page; the parts that move or matter take the
    // page's ink and its coral.
    this.side.color.copy(toInk(light ? 0.16 : 0.04));
    this.print.color.set(1, 1, 1);
    this.stoneTone.copy(toInk(light ? 0.42 : 0.4));
    this.hazardTone.copy(light ? toInk(0.85) : ink);
    this.accentTone.copy(accent);
    this.hazard.color.copy(this.hazardTone);
    this.chrome.color.copy(light ? toInk(0.45) : toInk(0.75));
    this.ballMaterial.color.copy(light ? toInk(0.5) : toInk(0.85));
    this.plastic.color.copy(light ? toInk(0.85) : ink);
    this.hole.color.copy(light ? toInk(0.9) : paper);
    for (const material of [this.bomb, this.rubber, this.glow, ...this.caps]) {
      material.color.copy(accent);
    }
    for (const material of [this.bomb, this.glow, ...this.caps]) {
      material.emissive.copy(accent);
    }

    wash(this.grid, ink, light ? 0.2 : 0.22);
    wash(this.tableShadow, light ? ink : paper, light ? 0.16 : 0.55);
    wash(this.ballShadow, light ? ink : paper, light ? 0.25 : 0.5);
    return light;
  }

  dispose() {
    const shared = [
      this.ringShape,
      this.cell,
      this.spike,
      this.sphere,
      this.drum,
      this.tube,
      this.disc,
      this.torus,
    ];
    for (const geometry of [...shared, ...this.own]) {
      geometry.dispose();
    }
    for (const material of [
      this.stone,
      this.debris,
      this.bomb,
      this.hazard,
      this.ballMaterial,
      this.ghost,
      this.glow,
      this.print,
      this.side,
      this.chrome,
      this.plastic,
      this.rubber,
      this.hole,
      this.grid,
      this.tableShadow,
      this.ballShadow,
      ...this.caps,
    ]) {
      material.dispose();
    }
    this.printTexture.dispose();
  }
}
