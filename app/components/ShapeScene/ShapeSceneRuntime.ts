import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  CircleGeometry,
  Color,
  InstancedBufferAttribute,
  MathUtils,
  Mesh,
  NearestFilter,
  PerspectiveCamera,
  Plane,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  type Texture,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';

import { CLOUD_COUNT, VIEW_MODES } from './shapeSceneConstants';
import {
  createColumnGeometry,
  createIslandCells,
  createMotes,
  createProps,
  sortCellsNearestFirst,
} from './shapeSceneGeometry';
import {
  columnDataFragmentShader,
  columnDataVertexShader,
  gridFragmentShader,
  gridVertexShader,
  moteFragmentShader,
  moteVertexShader,
  propFragmentShader,
  propVertexShader,
  terrainFragmentShader,
  terrainVertexShader,
} from './shapeSceneShaders';
import type { SceneTheme } from './shapeSceneTheme';

export interface SceneStats {
  drawCalls: number;
  triangles: number;
  instances: number;
  /** Smoothed main-thread cost of one frame in ms; 0 when the scene is static. */
  cpuMs: number;
}

export interface RuntimeOptions {
  isMobile: boolean;
  theme: SceneTheme;
  /** Called whenever the active view mode changes, including the automatic cycle. */
  onModeChange?: (mode: number) => void;
  /** Called a couple of times a second with numbers read back from the renderer. */
  onStats?: (stats: SceneStats) => void;
}

/** Decorative background: 1.5x is visually indistinguishable from 2x and ~44% fewer fragments. */
const MAX_PIXEL_RATIO = 1.5;
/** Ceiling on drawn pixels: very large windows give up resolution, not frame time. */
const MAX_PIXELS = 2_400_000;

const ISLAND_RADIUS = 5.2;
/** Columns across the island's diameter. */
const GRID_DESKTOP = 80;
const GRID_MOBILE = 44;
/** Share of a grid cell a column fills; the rest is the gap between columns. */
const COLUMN_FILL = 0.8;
/** The ground grid reaches this many island radii out before it has fully faded. */
const GRID_REACH = 2.3;
/** Minor grid lines; every fourth one is drawn stronger. Eight columns per cell on desktop. */
const GRID_SPACING = ISLAND_RADIUS / 5;
const GRID_SEGMENTS = 48;
/**
 * Instance orders kept ready, one per camera direction around the island. Drawing
 * the nearest columns first lets the depth test reject the hidden ones before they
 * are shaded; in the worst order the same frame costs about 70% more GPU time.
 */
const DRAW_ORDERS = 8;

const CAMERA_FOV = 32;
const CAMERA_ELEVATION = 0.5;
const CAMERA_AZIMUTH = 0.7;
const CAMERA_TARGET_Y = 1.1;
const ORBIT_SPEED = 0.035;

const WIPE_SECONDS = 1.5;
const FIRST_SWITCH_AFTER = 4.5;
/** How long each mode stays up before the cycle moves on; the lit view lingers. */
const DWELL_SECONDS = [7, 4, 4, 4];
/** After a visitor picks a mode, leave it alone for a while. */
const MANUAL_HOLD_SECONDS = 20;

/** Share of the island's cells that can grow a tree when their ground suits one. */
const TREE_DENSITY = 0.11;
const CLOUD_BLOCKS = 11;
/** Clouds cross the island along the wind, then re-enter on the upwind side. */
const CLOUD_WIND_ANGLE = 2.2;
const CLOUD_PATH_HALF_LENGTH = ISLAND_RADIUS * 1.35;
const CLOUD_CROSSING_SECONDS = 120;
/** Just above the tallest peaks, so the shadows stay close to the clouds that cast them. */
const CLOUD_ALTITUDE = 4.5;

interface Cloud {
  /** Sideways offset from the wind line through the island's centre. */
  lane: number;
  /** Where along its path the cloud starts, 0 to 1. */
  phase: number;
  speed: number;
  altitude: number;
  size: number;
}

/** Atmosphere motes: few enough to read as air, not as a particle effect. */
const MOTES_DESKTOP = 140;
const MOTES_MOBILE = 60;
/** How high the motes rise before they fade and start over, in world units. */
const MOTE_CEILING = 5.5;

/** A faint ring leaves the island's centre this often and fades as it crosses the ground. */
const PULSE_PERIOD = 12;
/** Share of the period the ring spends travelling; it rests for the remainder. */
const PULSE_TRAVEL = 0.62;
const PULSE_REACH = ISLAND_RADIUS * GRID_REACH * 0.85;
/**
 * The light circles the island against the camera's orbit, so the shadows sweep
 * across the terrain about once every minute and a half from the visitor's seat.
 */
const LIGHT_DRIFT = -0.04;
/** Starts well to the camera's side: light from behind the viewer would hide its own shadows. */
const LIGHT_AZIMUTH = CAMERA_AZIMUTH - 1.25;
/** Horizontal and vertical parts of the light's direction: a unit pair, about 37 degrees up. */
const LIGHT_FLAT = 0.8;
const LIGHT_RISE = 0.6;
/** Height between elevation contours, in world units. */
const CONTOUR_STEP = 0.5;

/** How fast the cursor takes hold of the swell (per second), and how long it takes to let go. */
const ENGAGE_RATE = 7;
const RELEASE_SECONDS = 4;
/** How slowly the camera settles back once the cursor has left (per second). */
const PARALLAX_RELEASE = 0.9;
const STATS_INTERVAL = 0.5;

/**
 * Dynamic resolution. If frames keep arriving late the scene draws fewer pixels
 * instead of dropping frames: a verdict every QUALITY_WINDOW frames, a step down
 * after two slow verdicts in a row. It never steps back up, so it cannot oscillate,
 * and it stops for good once a step fails to help (the bottleneck is not pixels).
 */
const SLOW_FRAME_FACTOR = 1.4;
const QUALITY_WINDOW = 45;
const QUALITY_STEP = 0.8;
const MIN_QUALITY = 0.5;
/** Terrain time used for the single frame drawn when motion is disabled. */
const STATIC_TIME = 8;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Owns the Three.js scene for the About section: an instanced terrain that can be
 * inspected through several render views. Framework-agnostic: the React wrapper
 * drives it via `update`, `resize`, `setPointer`, `setMode`, `setTheme`, and `dispose`.
 *
 * Per frame the CPU only advances a few scalars and sets uniforms; all geometry is
 * uploaded once and animated in the shaders.
 */
export class ShapeSceneRuntime {
  readonly isMobile: boolean;
  /** Set by the owner each frame; drives the easter-egg "chaos" mode. */
  boost = false;

  private readonly container: HTMLElement;
  private readonly onModeChange?: (mode: number) => void;
  private readonly onStats?: (stats: SceneStats) => void;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
  private readonly renderer: WebGLRenderer;
  /**
   * The data pass: a single triangle covering a texture with one texel per grid
   * cell. It works out each column's relief, sunlight and openness once a frame;
   * the terrain then only looks the result up.
   */
  private readonly columnScene = new Scene();
  private readonly columnCamera = new Camera();
  private readonly columnTarget: WebGLRenderTarget;
  private readonly columnGeometry = new BufferGeometry();
  private readonly columnMaterial: ShaderMaterial;
  private readonly terrainGeometry = createColumnGeometry();
  private readonly terrainMaterial: ShaderMaterial;
  private readonly gridGeometry = new CircleGeometry(ISLAND_RADIUS * GRID_REACH, GRID_SEGMENTS);
  private readonly gridMaterial: ShaderMaterial;
  private readonly moteGeometry = new BufferGeometry();
  private readonly moteMaterial: ShaderMaterial;
  /** Trees and clouds: the same unit box as the terrain, one instanced draw call. */
  private readonly propGeometry = createColumnGeometry();
  private readonly propMaterial: ShaderMaterial;
  private readonly clouds: Cloud[];
  /** Terrain columns, and columns plus props: the figure the stats readout reports. */
  private readonly instanceCount: number;
  private readonly drawnInstances: number;
  /** Cell centres in grid order, and the same cells sorted for each camera direction. */
  private readonly cells: Float32Array;
  private readonly cellOrders: (InstancedBufferAttribute | undefined)[] = [];
  private cellOrder = -1;

  private readonly terrainUniforms = {
    uTime: { value: STATIC_TIME },
    uCell: { value: 0 },
    uRadius: { value: ISLAND_RADIUS },
    uPointer: { value: new Vector3() },
    uBoost: { value: 0 },
    uPulse: { value: new Vector2() },
    uLow: { value: new Color() },
    uHigh: { value: new Color() },
    uAccent: { value: new Color() },
    uLine: { value: new Color() },
    uFog: { value: new Color() },
    uFogRange: { value: new Vector2() },
    uDepthRange: { value: new Vector2() },
    uModes: { value: new Vector2() },
    uWipeX: { value: -1 },
    uLight: { value: new Vector3() },
    uColumns: { value: null as Texture | null },
    uColumnsAcross: { value: 0 },
    uContourFrequency: { value: 1 / CONTOUR_STEP },
  };
  /** Where each cloud is this frame: xyz centre, w size. Read by two passes. */
  private readonly cloudUniform = {
    value: Array.from({ length: CLOUD_COUNT }, () => new Vector4()),
  };
  private readonly columnUniforms = {
    uSun: { value: new Vector3() },
    uClouds: this.cloudUniform,
    // Shared with the terrain: the same clock, swell and chaos drive both passes.
    uTime: this.terrainUniforms.uTime,
    uRadius: this.terrainUniforms.uRadius,
    uPointer: this.terrainUniforms.uPointer,
    uBoost: this.terrainUniforms.uBoost,
    uColumnsAcross: this.terrainUniforms.uColumnsAcross,
  };
  private readonly gridUniforms = {
    uLine: { value: new Color() },
    uAccent: { value: new Color() },
    uOpacity: { value: 0 },
    uSpacing: { value: GRID_SPACING },
    uRadius: { value: ISLAND_RADIUS * GRID_REACH },
    uIsland: { value: ISLAND_RADIUS },
    uPool: { value: 0 },
    // Shared with the terrain: the ring is one continuous thing, and the floor
    // under the island takes the terrain's colour.
    uPulse: this.terrainUniforms.uPulse,
    uLow: this.terrainUniforms.uLow,
  };
  private readonly propUniforms = {
    uClouds: this.cloudUniform,
    // Everything else is the terrain's: same data pass, light, colours and view modes.
    uColumns: this.terrainUniforms.uColumns,
    uColumnsAcross: this.terrainUniforms.uColumnsAcross,
    uRadius: this.terrainUniforms.uRadius,
    uTime: this.terrainUniforms.uTime,
    uBoost: this.terrainUniforms.uBoost,
    uHigh: this.terrainUniforms.uHigh,
    uAccent: this.terrainUniforms.uAccent,
    uLine: this.terrainUniforms.uLine,
    uFog: this.terrainUniforms.uFog,
    uFogRange: this.terrainUniforms.uFogRange,
    uDepthRange: this.terrainUniforms.uDepthRange,
    uModes: this.terrainUniforms.uModes,
    uWipeX: this.terrainUniforms.uWipeX,
    uLight: this.terrainUniforms.uLight,
  };
  private readonly moteUniforms = {
    uLine: { value: new Color() },
    uAccent: { value: new Color() },
    uOpacity: { value: 0 },
    uPixelRatio: { value: 1 },
    uReferenceDistance: { value: 1 },
    uCeiling: { value: MOTE_CEILING },
    // Shared with the terrain: same clock, same view modes, same wipe.
    uTime: this.terrainUniforms.uTime,
    uModes: this.terrainUniforms.uModes,
    uWipeX: this.terrainUniforms.uWipeX,
  };

  private readonly wipeLayer: HTMLDivElement;
  private readonly wipeLine: HTMLDivElement;
  private readonly wipeTag: HTMLSpanElement;
  private wipeShown = false;

  /** False until the shaders have compiled; nothing is drawn or advanced before that. */
  private ready = false;
  private disposed = false;

  private clock = 0;
  private terrainTime = STATIC_TIME;
  private boostAmount = 0;

  private mode = 0;
  private previousMode = 0;
  /** Progress of the wipe from `previousMode` to `mode`; 1 means finished. */
  private wipe = 1;
  private nextAutoSwitchAt = FIRST_SWITCH_AFTER;

  /** Canvas size in CSS pixels and its backing-store width, cached so frames never read the DOM. */
  private width = 0;
  private height = 0;
  private bufferWidth = 0;
  private pixelRatio = 0;

  /** Frame time the display is expected to deliver, and the running verdict on whether it does. */
  private readonly frameBudgetMs: number;
  private quality = 1;
  private paceMs = 0;
  private paceFrames = 0;
  private slowWindows = 0;
  private paceAtLastStep = Infinity;
  private qualitySettled = false;

  private cameraDistance = 14;
  /** How far the camera slides sideways so the island sits right of centre on wide layouts. */
  private cameraShift = 0;
  private parallaxX = 0;
  private parallaxY = 0;
  private pointerX = 0;
  private pointerY = 0;
  private hasPointer = false;
  /** 0 to 1: how much the cursor, rather than the wanderer, steers the swell. */
  private engagement = 0;
  /** Where on the ground the cursor last touched the island. */
  private heldX = 0;
  private heldZ = 0;

  private readonly raycaster = new Raycaster();
  private readonly pointerNDC = new Vector2();
  private readonly groundPlane = new Plane(new Vector3(0, 1, 0), -CAMERA_TARGET_Y);
  private readonly groundHit = new Vector3();

  private cpuMs = 0;
  private statsDueAt = 0;

  constructor(container: HTMLElement, options: RuntimeOptions) {
    this.container = container;
    this.isMobile = options.isMobile;
    this.frameBudgetMs = 1000 / (options.isMobile ? 30 : 60);
    this.onModeChange = options.onModeChange;
    this.onStats = options.onStats;

    this.renderer = new WebGLRenderer({
      antialias: !options.isMobile,
      alpha: true,
      powerPreference: 'low-power',
    });
    this.renderer.setClearColor(0x000000, 0);
    // Draw order is fixed (terrain, then grid, then motes), so there is nothing to sort.
    this.renderer.sortObjects = false;
    // Two passes make up one frame: count their draw calls together.
    this.renderer.info.autoReset = false;
    this.renderer.domElement.style.display = 'block';
    container.append(this.renderer.domElement);

    const columns = options.isMobile ? GRID_MOBILE : GRID_DESKTOP;
    this.cells = createIslandCells(columns, ISLAND_RADIUS);
    this.instanceCount = this.cells.length / 2;
    this.terrainGeometry.instanceCount = this.instanceCount;
    this.orderTerrain(CAMERA_AZIMUTH);

    // Data pass. An ordinary 8-bit target, so it needs no float-texture extension;
    // nearest filtering because each texel is one column's record, never blended.
    this.columnTarget = new WebGLRenderTarget(columns, columns, {
      depthBuffer: false,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
    });
    this.terrainUniforms.uColumns.value = this.columnTarget.texture;
    this.terrainUniforms.uColumnsAcross.value = columns;
    // One oversized triangle covers the whole target without a diagonal seam.
    this.columnGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    this.columnMaterial = new ShaderMaterial({
      vertexShader: columnDataVertexShader,
      fragmentShader: columnDataFragmentShader,
      uniforms: this.columnUniforms,
      depthTest: false,
      depthWrite: false,
    });
    const columnPass = new Mesh(this.columnGeometry, this.columnMaterial);
    columnPass.frustumCulled = false;
    columnPass.matrixAutoUpdate = false;
    this.columnScene.add(columnPass);
    this.columnScene.matrixWorldAutoUpdate = false;

    this.terrainUniforms.uCell.value = ((ISLAND_RADIUS * 2) / columns) * COLUMN_FILL;
    this.terrainMaterial = new ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: this.terrainUniforms,
    });
    const terrain = new Mesh(this.terrainGeometry, this.terrainMaterial);

    const propData = createProps(
      this.cells,
      (ISLAND_RADIUS * 2) / columns,
      TREE_DENSITY,
      CLOUD_COUNT,
      CLOUD_BLOCKS,
    );
    this.propGeometry.setAttribute('aAnchor', new InstancedBufferAttribute(propData.anchors, 3));
    this.propGeometry.setAttribute('aBox', new InstancedBufferAttribute(propData.boxes, 4));
    this.propGeometry.instanceCount = propData.count;
    this.drawnInstances = this.instanceCount + propData.count;
    this.propMaterial = new ShaderMaterial({
      vertexShader: propVertexShader,
      fragmentShader: propFragmentShader,
      uniforms: this.propUniforms,
    });
    const props = new Mesh(this.propGeometry, this.propMaterial);
    this.clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
      lane: ((i + 0.5) / CLOUD_COUNT - 0.5) * ISLAND_RADIUS * 1.4 + (Math.random() - 0.5) * 0.6,
      // Spread along the path so they never arrive as a row.
      phase: (i * 0.618) % 1,
      speed: 0.8 + Math.random() * 0.4,
      altitude: CLOUD_ALTITUDE + Math.random() * 0.9,
      size: 0.7 + Math.random() * 0.3,
    }));

    // A disc rather than a square, so no fragments are spent on corners that fade to nothing.
    this.gridMaterial = new ShaderMaterial({
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      uniforms: this.gridUniforms,
      transparent: true,
      depthWrite: false,
    });
    const ground = new Mesh(this.gridGeometry, this.gridMaterial);
    ground.rotation.x = -Math.PI / 2;
    // A hair below the column bases, so the two never fight over the same depth.
    ground.position.y = -0.01;

    const moteData = createMotes(
      options.isMobile ? MOTES_MOBILE : MOTES_DESKTOP,
      ISLAND_RADIUS * 1.35,
      MOTE_CEILING,
    );
    this.moteGeometry.setAttribute('position', new BufferAttribute(moteData.positions, 3));
    this.moteGeometry.setAttribute('aSeed', new BufferAttribute(moteData.seeds, 1));
    this.moteMaterial = new ShaderMaterial({
      vertexShader: moteVertexShader,
      fragmentShader: moteFragmentShader,
      uniforms: this.moteUniforms,
      transparent: true,
      depthWrite: false,
    });
    const motes = new Points(this.moteGeometry, this.moteMaterial);

    // Nothing in the scene graph ever moves (the shaders do all the motion), so its
    // matrices are computed once here instead of being re-derived every frame, and
    // frustum culling is off because the static bounds say nothing about what is drawn.
    this.scene.add(terrain, props, ground, motes);
    this.scene.updateMatrixWorld(true);
    this.scene.matrixWorldAutoUpdate = false;
    for (const object of [terrain, props, ground, motes]) {
      object.matrixAutoUpdate = false;
      object.frustumCulled = false;
    }

    // The wipe's leading edge is a DOM line, so it also crosses the empty sky.
    this.wipeLayer = document.createElement('div');
    this.wipeLayer.className = 'scene-wipe-layer';
    this.wipeLine = document.createElement('div');
    this.wipeLine.className = 'scene-wipe';
    this.wipeTag = document.createElement('span');
    this.wipeTag.className = 'scene-wipe-tag';
    this.wipeLine.append(this.wipeTag);
    this.wipeLayer.append(this.wipeLine);
    container.append(this.wipeLayer);

    this.setTheme(options.theme);
    this.resize();

    // Compile the shader programs off the main thread where the driver allows it, so
    // the page does not stall while the visitor is scrolling toward the scene.
    void this.compileThenRender();
  }

  private async compileThenRender(): Promise<void> {
    await Promise.all([
      this.renderer.compileAsync(this.columnScene, this.columnCamera),
      this.renderer.compileAsync(this.scene, this.camera),
    ]);
    if (!this.disposed) {
      this.ready = true;
      this.render();
    }
  }

  /** Swaps every theme-dependent color in place; no geometry or GL state is rebuilt. */
  setTheme(theme: SceneTheme): void {
    const terrain = this.terrainUniforms;
    terrain.uLow.value.copy(theme.low);
    terrain.uHigh.value.copy(theme.high);
    terrain.uAccent.value.copy(theme.accent);
    terrain.uLine.value.copy(theme.line);
    terrain.uFog.value.copy(theme.fog);

    // Thin light marks on near-black lose most of their contrast on a real display, so
    // the dark theme runs the grid and motes far stronger than the light one.
    const grid = this.gridUniforms;
    grid.uLine.value.copy(theme.line);
    grid.uAccent.value.copy(theme.accent);
    grid.uOpacity.value = theme.isLight ? 0.26 : 0.6;
    // Dark ink on a light page reads as a shadow; light ink on a dark one as spill light.
    grid.uPool.value = theme.isLight ? 0.07 : 0.045;

    const motes = this.moteUniforms;
    motes.uLine.value.copy(theme.line);
    motes.uAccent.value.copy(theme.accent);
    motes.uOpacity.value = theme.isLight ? 0.34 : 1;
  }

  /** Pointer position normalized to [-1, 1] across the container (y grows downward). */
  setPointer(x: number, y: number): void {
    this.pointerX = x;
    this.pointerY = y;
    this.hasPointer = true;
  }

  clearPointer(): void {
    this.pointerX = 0;
    this.pointerY = 0;
    this.hasPointer = false;
  }

  /**
   * Switches the render view.
   * @param manual  a visitor asked for it: the automatic cycle backs off for a while
   * @param instant skip the wipe (used when motion is disabled)
   */
  setMode(mode: number, manual = false, instant = false): void {
    if (manual) {
      this.nextAutoSwitchAt = this.clock + MANUAL_HOLD_SECONDS;
    }
    if (mode === this.mode) {
      return;
    }
    this.previousMode = this.mode;
    this.mode = mode;
    this.wipe = instant ? 1 : 0;
    this.wipeTag.textContent = VIEW_MODES[mode] ?? '';
    this.onModeChange?.(mode);
  }

  /** Re-fits the canvas and camera to the container. Cheap to call when nothing changed. */
  resize(): void {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const pixelRatio =
      Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO, Math.sqrt(MAX_PIXELS / (width * height))) *
      this.quality;
    if (width === this.width && height === this.height && pixelRatio === this.pixelRatio) {
      return;
    }
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.bufferWidth = this.renderer.domElement.width;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Wide layouts fade the canvas out on the left, so the island only gets the
    // right-hand part of the frame; narrow ones use the full width.
    const wide = window.matchMedia('(min-width: 768px)').matches;
    const usableWidth = wide ? 0.7 : 0.94;
    const tanHalfFov = Math.tan(MathUtils.degToRad(CAMERA_FOV / 2));
    const fitWidth = (ISLAND_RADIUS * 1.08) / (tanHalfFov * this.camera.aspect * usableWidth);
    const fitHeight = (ISLAND_RADIUS * Math.sin(CAMERA_ELEVATION) + 2.9) / tanHalfFov;
    this.cameraDistance = Math.max(fitWidth, fitHeight);
    const visibleWidth = 2 * this.cameraDistance * tanHalfFov * this.camera.aspect;
    this.cameraShift = wide ? visibleWidth * 0.13 : 0;

    this.moteUniforms.uPixelRatio.value = pixelRatio;
    this.moteUniforms.uReferenceDistance.value = this.cameraDistance;
    this.terrainUniforms.uFogRange.value.set(
      this.cameraDistance - ISLAND_RADIUS * 0.35,
      this.cameraDistance + ISLAND_RADIUS * 1.3,
    );
    this.terrainUniforms.uDepthRange.value.set(
      this.cameraDistance - ISLAND_RADIUS * 1.05,
      this.cameraDistance + ISLAND_RADIUS * 1.05,
    );
  }

  /** Draws the current state without advancing it. */
  render(): void {
    if (!this.ready) {
      return;
    }
    this.draw();
    this.emitStats();
  }

  /**
   * Advances the simulation and renders one frame.
   * @param elapsedMs time since the previous rendered frame
   */
  update(elapsedMs: number): void {
    if (!this.ready) {
      return;
    }
    const started = performance.now();
    const dt = Math.min(elapsedMs, 50) / 1000;
    this.clock += dt;

    this.boostAmount += ((this.boost ? 1 : 0) - this.boostAmount) * (1 - Math.exp(-dt * 5));
    this.terrainTime += dt * (1 + this.boostAmount * 3.5);

    this.stepWipe(dt);
    this.stepPointer(dt);
    this.draw();
    this.trackPace(elapsedMs);

    const cost = performance.now() - started;
    this.cpuMs = this.cpuMs === 0 ? cost : this.cpuMs + (cost - this.cpuMs) * 0.08;
    if (this.clock >= this.statsDueAt) {
      this.statsDueAt = this.clock + STATS_INTERVAL;
      this.emitStats();
    }
  }

  dispose(): void {
    this.disposed = true;
    this.terrainGeometry.dispose();
    this.terrainMaterial.dispose();
    this.gridGeometry.dispose();
    this.gridMaterial.dispose();
    this.moteGeometry.dispose();
    this.moteMaterial.dispose();
    this.propGeometry.dispose();
    this.propMaterial.dispose();
    this.columnGeometry.dispose();
    this.columnMaterial.dispose();
    this.columnTarget.dispose();
    this.renderer.dispose();
    // Hand the GL context back now rather than whenever the canvas is collected;
    // browsers cap how many can be alive at once.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.wipeLayer.remove();
  }

  // ---------------------------------------------------------------------------
  // Per-frame steps
  // ---------------------------------------------------------------------------

  private stepWipe(dt: number): void {
    if (this.wipe < 1) {
      this.wipe = Math.min(1, this.wipe + dt / WIPE_SECONDS);
      if (this.wipe >= 1) {
        this.nextAutoSwitchAt = Math.max(
          this.nextAutoSwitchAt,
          this.clock + (DWELL_SECONDS[this.mode] ?? 4),
        );
      }
      return;
    }
    if (this.clock >= this.nextAutoSwitchAt) {
      this.setMode((this.mode + 1) % VIEW_MODES.length);
    }
  }

  private stepPointer(dt: number): void {
    // The camera leans toward the cursor quickly and settles back slowly.
    const parallaxEase = 1 - Math.exp(-dt * (this.hasPointer ? 2.4 : PARALLAX_RELEASE));
    this.parallaxX += (this.pointerX - this.parallaxX) * parallaxEase;
    this.parallaxY += (this.pointerY - this.parallaxY) * parallaxEase;

    let onIsland = false;
    if (this.hasPointer) {
      // The camera still holds the matrices of the frame the visitor is looking at.
      this.pointerNDC.set(this.pointerX, -this.pointerY);
      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.groundHit);
      if (hit && Math.hypot(hit.x, hit.z) < ISLAND_RADIUS * 1.15) {
        onIsland = true;
        this.heldX = hit.x;
        this.heldZ = hit.z;
      }
    }

    // How much the cursor owns the swell. It takes over at once but lets go over a
    // few seconds: after the cursor leaves, the swell lingers where it was and then
    // drifts back to the wandering path, instead of snapping to it. The release runs
    // down at a steady rate so that the ease below starts and ends at a standstill.
    this.engagement = onIsland
      ? this.engagement + (1 - this.engagement) * (1 - Math.exp(-dt * ENGAGE_RATE))
      : Math.max(0, this.engagement - dt / RELEASE_SECONDS);
    const hold = MathUtils.smootherstep(this.engagement, 0, 1);

    // Without a cursor, a slow wanderer keeps one swell travelling.
    const wanderX = Math.cos(this.clock * 0.31) * ISLAND_RADIUS * 0.5;
    const wanderZ = Math.sin(this.clock * 0.43) * ISLAND_RADIUS * 0.45;
    const targetX = MathUtils.lerp(wanderX, this.heldX, hold);
    const targetZ = MathUtils.lerp(wanderZ, this.heldZ, hold);

    const swell = this.terrainUniforms.uPointer.value;
    const follow = 1 - Math.exp(-dt * MathUtils.lerp(1.6, 9, hold));
    swell.x += (targetX - swell.x) * follow;
    swell.y += (targetZ - swell.y) * follow;
    swell.z += (MathUtils.lerp(0.55, 1, hold) - swell.z) * (1 - Math.exp(-dt * 3));
  }

  /** Lowers the resolution when frames have been arriving late for a sustained stretch. */
  private trackPace(elapsedMs: number): void {
    if (this.qualitySettled) {
      return;
    }
    // One long stall (a tab switch, a GC pause) should not count as many slow frames.
    this.paceMs += Math.min(elapsedMs, this.frameBudgetMs * 3);
    this.paceFrames += 1;
    if (this.paceFrames < QUALITY_WINDOW) {
      return;
    }
    const average = this.paceMs / this.paceFrames;
    this.paceMs = 0;
    this.paceFrames = 0;
    this.slowWindows = average > this.frameBudgetMs * SLOW_FRAME_FACTOR ? this.slowWindows + 1 : 0;
    if (this.slowWindows < 2) {
      return;
    }
    this.slowWindows = 0;
    // Still as slow as before the last step: something other than fill rate is the
    // bottleneck, and giving up more sharpness would buy nothing.
    if (average > this.paceAtLastStep * 0.9 || this.quality <= MIN_QUALITY) {
      this.qualitySettled = true;
      return;
    }
    this.paceAtLastStep = average;
    this.quality = Math.max(MIN_QUALITY, this.quality * QUALITY_STEP);
    this.resize();
  }

  /** Binds the instance order whose nearest-first direction best matches the camera. */
  private orderTerrain(azimuth: number): void {
    const sector = MathUtils.euclideanModulo(
      Math.round((azimuth / (Math.PI * 2)) * DRAW_ORDERS),
      DRAW_ORDERS,
    );
    if (sector === this.cellOrder) {
      return;
    }
    this.cellOrder = sector;
    // Built the first time the camera faces that way, then kept.
    this.cellOrders[sector] ??= new InstancedBufferAttribute(
      sortCellsNearestFirst(this.cells, (sector / DRAW_ORDERS) * Math.PI * 2),
      2,
    );
    this.terrainGeometry.setAttribute('aCell', this.cellOrders[sector]);
  }

  private draw(): void {
    const uniforms = this.terrainUniforms;
    uniforms.uTime.value = this.terrainTime;
    uniforms.uBoost.value = this.boostAmount;
    uniforms.uModes.value.set(this.mode, this.previousMode);

    // Passive detail. With motion disabled the clock never advances, which parks
    // the ring at zero strength and the light at its starting angle.
    const travel = Math.min((this.clock % PULSE_PERIOD) / PULSE_PERIOD / PULSE_TRAVEL, 1);
    const strength =
      this.clock > 0 ? MathUtils.smoothstep(travel, 0, 0.1) * (1 - travel) ** 1.5 : 0;
    uniforms.uPulse.value.set(travel * PULSE_REACH, strength);

    // The same light twice: as a unit vector for shading, and as a ground direction
    // plus climb rate for the shadow rays.
    const lightAngle = LIGHT_AZIMUTH + this.clock * LIGHT_DRIFT;
    const lightX = Math.sin(lightAngle);
    const lightZ = Math.cos(lightAngle);
    uniforms.uLight.value.set(lightX * LIGHT_FLAT, LIGHT_RISE, lightZ * LIGHT_FLAT);
    this.columnUniforms.uSun.value.set(lightX, lightZ, LIGHT_RISE / LIGHT_FLAT);

    this.placeClouds();
    this.placeWipe();
    this.placeCamera();

    const { renderer } = this;
    renderer.info.reset();
    renderer.setRenderTarget(this.columnTarget);
    renderer.render(this.columnScene, this.columnCamera);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  /** Advances each cloud along the wind; it shrinks to nothing where its path wraps. */
  private placeClouds(): void {
    const windX = Math.sin(CLOUD_WIND_ANGLE);
    const windZ = Math.cos(CLOUD_WIND_ANGLE);
    for (const [i, cloud] of this.clouds.entries()) {
      const progress = (cloud.phase + (this.clock / CLOUD_CROSSING_SECONDS) * cloud.speed) % 1;
      const along = MathUtils.lerp(-CLOUD_PATH_HALF_LENGTH, CLOUD_PATH_HALF_LENGTH, progress);
      const presence =
        MathUtils.smoothstep(progress, 0, 0.1) * (1 - MathUtils.smoothstep(progress, 0.9, 1));
      this.cloudUniform.value[i].set(
        windX * along + windZ * cloud.lane,
        cloud.altitude,
        windZ * along - windX * cloud.lane,
        cloud.size * presence,
      );
    }
  }

  /** Moves the wipe's shader edge and its DOM line. Touches the DOM only while a wipe runs. */
  private placeWipe(): void {
    if (this.wipe >= 1) {
      this.terrainUniforms.uWipeX.value = -1;
      if (this.wipeShown) {
        this.wipeShown = false;
        this.wipeLine.style.opacity = '0';
      }
      return;
    }
    // The wipe runs right to left and overshoots both edges so it never stalls on screen.
    const position = MathUtils.lerp(1.06, -0.06, easeInOutCubic(this.wipe));
    this.terrainUniforms.uWipeX.value = position * this.bufferWidth;
    this.wipeShown = true;
    this.wipeLine.style.opacity = Math.sqrt(Math.sin(Math.PI * this.wipe)).toFixed(3);
    this.wipeLine.style.transform = `translate3d(${(position * this.width).toFixed(1)}px, 0, 0)`;
  }

  private placeCamera(): void {
    const { camera, clock } = this;
    const shake = this.boostAmount * 0.05;
    const azimuth =
      CAMERA_AZIMUTH + clock * ORBIT_SPEED + this.parallaxX * 0.28 + Math.sin(clock * 37) * shake;
    const elevation = CAMERA_ELEVATION - this.parallaxY * 0.07 + Math.cos(clock * 43) * shake * 0.5;

    this.orderTerrain(azimuth);

    const horizontal = Math.cos(elevation) * this.cameraDistance;
    camera.position.set(
      Math.sin(azimuth) * horizontal,
      CAMERA_TARGET_Y + Math.sin(elevation) * this.cameraDistance,
      Math.cos(azimuth) * horizontal,
    );
    camera.lookAt(0, CAMERA_TARGET_Y, 0);
    // Slide sideways along the camera's own right axis: the island moves right in frame.
    // The renderer refreshes the camera's world matrix itself when it draws.
    camera.translateX(-this.cameraShift);
  }

  private emitStats(): void {
    const { render } = this.renderer.info;
    this.onStats?.({
      drawCalls: render.calls,
      triangles: render.triangles,
      instances: this.drawnInstances,
      cpuMs: this.cpuMs,
    });
  }
}
