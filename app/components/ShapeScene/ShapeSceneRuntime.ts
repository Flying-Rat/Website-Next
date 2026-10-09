import * as THREE from 'three';

import {
  type ParticleData,
  type ShapeData,
  type ShapeType,
  createShapeGeometry,
  edgeCreaseAngle,
} from './shapeSceneGeometry';
import { fragmentShader, vertexShader } from './shapeSceneShaders';
import type { SceneTheme } from './shapeSceneTheme';

export interface RuntimeOptions {
  isMobile: boolean;
  /** Whether the device has a hover-capable pointer; disables raycasting when false. */
  hoverEnabled: boolean;
  theme: SceneTheme;
}

interface DotTraverser {
  shapeA: number;
  shapeB: number;
  t: number;
}

const MAX_CONSTELLATION_DIST = 5.5;
const MAX_CONSTELLATION_DIST_SQ = MAX_CONSTELLATION_DIST * MAX_CONSTELLATION_DIST;
const DOT_SPEED = 0.18;
const FOG_DENSITY = 0.06;
/** Decorative background: 1.5x is visually indistinguishable from 2x and ~44% fewer fragments. */
const MAX_PIXEL_RATIO = 1.5;
/** When the pointer is still, re-check hover only every N frames (shapes drift under it). */
const HOVER_RECHECK_FRAMES = 4;

function makeRadialTexture(size: number, midStop: number, midAlpha: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(midStop, `rgba(255,255,255,${midAlpha})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function deriveHoverColor(base: THREE.Color, out: THREE.Color): THREE.Color {
  return out.setRGB(
    Math.min(1, base.r * 1.5 + 0.35),
    Math.min(1, base.g * 1.3 + 0.22),
    Math.min(1, base.b * 1.0 + 0.1),
  );
}

/**
 * Owns the Three.js scene for the About section. Framework-agnostic: the React
 * wrapper drives it via `update`, `resize`, `setPointer`, `setTheme`, and `dispose`.
 */
export class ShapeSceneRuntime {
  readonly isMobile: boolean;
  /** Set by the owner each frame; drives the easter-egg "chaos" mode. */
  boost = false;

  private readonly container: HTMLElement;
  private readonly hoverEnabled: boolean;
  private readonly cameraParallax: number;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;

  private readonly grid: THREE.GridHelper;
  private readonly gridMat: THREE.LineBasicMaterial;
  private gridBaseOpacity = 0.12;
  private auraBaseOpacity = 0.6;

  private readonly shapes: ShapeData[] = [];
  private readonly shapeMeshes: THREE.Mesh[] = [];
  private readonly auraTexture: THREE.CanvasTexture;
  private readonly auraMaterialBase: THREE.SpriteMaterial;

  private readonly particles: ParticleData[] = [];
  private readonly particleGeometry = new THREE.BufferGeometry();
  private readonly particlePositions: Float32Array;
  private readonly particleMaterial: THREE.PointsMaterial;

  private readonly constellationGeometry = new THREE.BufferGeometry();
  private readonly constellationPositions: Float32Array;
  private readonly constellationColors: Float32Array;
  private readonly constellationDistances: Float32Array;
  private readonly constellationPairShapes: Int32Array;
  private readonly constellationMaterial: THREE.LineDashedMaterial;
  private readonly constellationMesh: THREE.LineSegments;

  private readonly dotGeometry = new THREE.BufferGeometry();
  private readonly dotPositions: Float32Array;
  private readonly dotTexture: THREE.CanvasTexture;
  private readonly dotMaterial: THREE.PointsMaterial;
  private readonly dotTraversers: DotTraverser[];
  private readonly dotCandidateA: Int32Array;
  private readonly dotCandidateB: Int32Array;

  private spawnBounds = { shapeX: 0, shapeY: 0, particleX: 0, particleY: 0 };
  private pointerX = 0;
  private pointerY = 0;
  private targetPointerX = 0;
  private targetPointerY = 0;
  private pointerDirty = false;
  private hoveredMesh: THREE.Object3D | null = null;
  private frame = 0;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNDC = new THREE.Vector2();
  private readonly tmpColor = new THREE.Color();

  constructor(container: HTMLElement, options: RuntimeOptions) {
    this.container = container;
    this.isMobile = options.isMobile;
    this.hoverEnabled = options.hoverEnabled;
    const { isMobile } = options;
    const theme = options.theme;

    const subdivisions = isMobile ? 6 : 10;
    this.cameraParallax = isMobile ? 0.95 : 1.6;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    // Zoom out slightly on mobile to give more breathing room and reduce crowding
    this.camera.position.set(0, 0, isMobile ? 14 : 10);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    this.syncViewport();

    // Grid floor
    this.grid = new THREE.GridHelper(28, 28, theme.grid, theme.grid);
    this.gridMat = this.grid.material as THREE.LineBasicMaterial;
    this.gridMat.transparent = true;
    this.grid.position.set(0, -4, -2);
    this.grid.rotation.x = Math.PI * 0.08;
    this.scene.add(this.grid);

    // Shapes
    this.auraTexture = makeRadialTexture(128, 0.3, 0.3);
    this.auraMaterialBase = new THREE.SpriteMaterial({
      map: this.auraTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const shapeCount = isMobile
      ? 2 + Math.floor(Math.random() * 2)
      : 9 + Math.floor(Math.random() * 3);
    this.spawnShapes(shapeCount, subdivisions, theme);

    // Ambient particles
    const particleCount = isMobile
      ? 2 + Math.floor(Math.random() * 2)
      : 12 + Math.floor(Math.random() * 6);
    this.particlePositions = new Float32Array(particleCount * 3);
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.particlePositions, 3),
    );
    this.particleMaterial = new THREE.PointsMaterial({
      color: theme.accent,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.scene.add(new THREE.Points(this.particleGeometry, this.particleMaterial));
    for (let i = 0; i < particleCount; i++) {
      const basePos = new THREE.Vector3(
        (Math.random() * 2 - 1) * this.spawnBounds.particleX,
        (isMobile ? Math.random() * 1.2 - 0.2 : Math.random() * 2 - 1) * this.spawnBounds.particleY,
        (Math.random() - 0.5) * 3 - 2,
      );
      basePos.toArray(this.particlePositions, i * 3);
      this.particles.push({ basePosition: basePos, phase: Math.random() * Math.PI * 2 });
    }

    // Constellation lines between nearby shapes
    const maxPairs = (shapeCount * (shapeCount - 1)) / 2;
    this.constellationPositions = new Float32Array(maxPairs * 2 * 3);
    this.constellationColors = new Float32Array(maxPairs * 2 * 3);
    this.constellationDistances = new Float32Array(maxPairs * 2);
    this.constellationPairShapes = new Int32Array(maxPairs * 2);
    this.constellationGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.constellationPositions, 3),
    );
    this.constellationGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.constellationColors, 3),
    );
    this.constellationGeometry.setAttribute(
      'lineDistance',
      new THREE.BufferAttribute(this.constellationDistances, 1),
    );
    this.constellationMaterial = new THREE.LineDashedMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      dashSize: 0.35,
      gapSize: 0.25,
    });
    this.constellationMesh = new THREE.LineSegments(
      this.constellationGeometry,
      this.constellationMaterial,
    );
    this.scene.add(this.constellationMesh);

    // Dots travelling along constellation lines
    const dotCount = isMobile ? 2 : 6;
    this.dotPositions = new Float32Array(dotCount * 3);
    this.dotGeometry.setAttribute('position', new THREE.BufferAttribute(this.dotPositions, 3));
    this.dotTexture = makeRadialTexture(32, 0.45, 0.6);
    this.dotMaterial = new THREE.PointsMaterial({
      size: 0.28,
      map: this.dotTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
      alphaTest: 0.01,
    });
    this.scene.add(new THREE.Points(this.dotGeometry, this.dotMaterial));
    this.dotTraversers = Array.from({ length: dotCount }, () => ({
      shapeA: -1,
      shapeB: -1,
      t: Math.random(),
    }));
    this.dotCandidateA = new Int32Array(maxPairs);
    this.dotCandidateB = new Int32Array(maxPairs);

    this.setTheme(theme);
    this.resize();
  }

  /** Swaps every theme-dependent color in place; no geometry or GL state is rebuilt. */
  setTheme(theme: SceneTheme): void {
    this.gridBaseOpacity = theme.isLight ? 0.15 : 0.12;
    this.auraBaseOpacity = theme.isLight ? 0.35 : 0.6;
    this.gridMat.color.copy(theme.grid);
    this.particleMaterial.color.copy(theme.accent);
    this.dotMaterial.color.copy(theme.accent).lerp(this.tmpColor.set(0xffffff), 0.2);

    for (const shape of this.shapes) {
      shape.color.copy(shape.isAccent ? theme.accent : theme.steel);
      deriveHoverColor(shape.color, shape.hoverColor);
      shape.aura.material.color.copy(shape.color);

      const material = shape.mesh.material;
      if (material instanceof THREE.ShaderMaterial) {
        material.uniforms.uColor.value.copy(shape.color);
        material.uniforms.uHoverColor.value.copy(shape.hoverColor);
        material.uniforms.uFogColor.value.copy(theme.fog);
      }
    }
  }

  /** Pointer position normalized to [-1, 1] across the container. */
  setPointer(x: number, y: number): void {
    this.targetPointerX = x;
    this.targetPointerY = y;
    this.pointerDirty = true;
  }

  clearPointer(): void {
    this.setPointer(0, 0);
  }

  resize(): void {
    this.syncViewport();
    this.spawnBounds = this.getSpawnBounds();
    const { shapeX, shapeY, particleX, particleY } = this.spawnBounds;

    for (const shape of this.shapes) {
      const base = shape.basePosition;
      const limitX = Math.max(0.8, shapeX - shape.scale * 0.5);
      const limitY = Math.max(0.7, shapeY - shape.scale * 0.5);
      base.x = THREE.MathUtils.clamp(base.x, -limitX, limitX);
      base.y = THREE.MathUtils.clamp(base.y, -limitY, limitY);
      shape.mesh.position.x = base.x;
      shape.mesh.position.y = base.y;
      if (shape.edges) {
        shape.edges.position.x = base.x;
        shape.edges.position.y = base.y;
      }
    }

    for (let pi = 0; pi < this.particles.length; pi++) {
      const base = this.particles[pi].basePosition;
      base.x = THREE.MathUtils.clamp(base.x, -particleX, particleX);
      base.y = THREE.MathUtils.clamp(base.y, -particleY, particleY);
      this.particlePositions[pi * 3] = base.x;
      this.particlePositions[pi * 3 + 1] = base.y;
    }
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  /** Draws the current state without advancing the simulation. */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Advances the simulation and renders one frame.
   * @param time   `requestAnimationFrame` timestamp in ms
   * @param elapsedMs time since the previous rendered frame
   */
  update(time: number, elapsedMs: number): void {
    this.frame += 1;
    const dtNorm = Math.min(elapsedMs / 16.667, 3);
    const t = time * 0.001;
    const boost = this.boost;
    const boostAmt = boost ? 1 : 0;
    const speedMultiplier = boost ? 2.5 : 1;

    this.updateCamera(t, dtNorm);
    this.updateShapeTransforms(t, dtNorm, speedMultiplier, boostAmt);
    this.updateHover();
    this.updateShapeAppearance(t, dtNorm, speedMultiplier, boostAmt);
    const pairCount = this.updateConstellation(t);
    this.updateDots(pairCount, elapsedMs, speedMultiplier);
    this.updateAmbient(t, boost);

    this.render();
  }

  dispose(): void {
    this.grid.geometry.dispose();
    this.gridMat.dispose();
    this.constellationGeometry.dispose();
    this.constellationMaterial.dispose();
    this.dotGeometry.dispose();
    this.dotTexture.dispose();
    this.dotMaterial.dispose();

    for (const shape of this.shapes) {
      shape.mesh.geometry.dispose();
      (shape.mesh.material as THREE.Material).dispose();
      if (shape.edges) {
        shape.edges.geometry.dispose();
        (shape.edges.material as THREE.Material).dispose();
      }
      shape.aura.material.dispose();
    }
    this.auraTexture.dispose();
    this.auraMaterialBase.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  private syncViewport(): void {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private getViewSizeAtZ(worldZ = 0) {
    const distance = Math.abs(this.camera.position.z - worldZ);
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const height = 2 * Math.tan(verticalFov / 2) * distance;
    return { width: height * this.camera.aspect, height };
  }

  private getSpawnBounds() {
    const { isMobile, cameraParallax } = this;
    const view = this.getViewSizeAtZ(0);
    const halfWidth = view.width * 0.5;
    const halfHeight = view.height * 0.5;
    return {
      shapeX: Math.max(1.2, halfWidth - (isMobile ? 1.0 : 1.6) - cameraParallax),
      shapeY: Math.max(1.0, halfHeight - (isMobile ? 1.2 : 1.5)),
      particleX: Math.max(1.6, halfWidth - (isMobile ? 0.35 : 0.8)),
      particleY: Math.max(1.3, halfHeight - (isMobile ? 0.5 : 0.9)),
    };
  }

  private spawnShapes(shapeCount: number, subdivisions: number, theme: SceneTheme): void {
    this.spawnBounds = this.getSpawnBounds();
    const { isMobile } = this;
    const placed: { pos: THREE.Vector3; size: number }[] = [];

    for (let i = 0; i < shapeCount; i++) {
      const size = i === 0 ? 1.2 + Math.random() * 0.2 : 0.5 + Math.random() * 0.4;
      const isWireframe = i > 1 && Math.random() < 0.4;
      const isAccent = i === 0 || Math.random() < 0.5;
      const shapeType = i === 0 ? 'box' : this.rollShapeType();
      const position = isMobile
        ? this.pickMobilePosition(size, placed)
        : this.pickDesktopPosition(i === 0 ? 0.55 : 1.0, size, placed);
      placed.push({ pos: position.clone(), size });

      const color = (isAccent ? theme.accent : theme.steel).clone();
      const hoverColor = deriveHoverColor(color, new THREE.Color());
      const geometry = createShapeGeometry(shapeType, size, isWireframe, subdivisions);

      let material: THREE.Material;
      let edges: THREE.LineSegments | null = null;
      if (isWireframe) {
        material = new THREE.MeshBasicMaterial({ visible: false });
        edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, edgeCreaseAngle(shapeType)),
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: isAccent ? 0.85 : 0.7,
          }),
        );
        edges.position.copy(position);
      } else {
        const explosionScale =
          shapeType === 'torus' ? 0.08 + Math.random() * 0.06 : 0.28 + Math.random() * 0.18;
        material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: color.clone() },
            uHoverColor: { value: hoverColor.clone() },
            uOpacity: { value: isAccent ? 0.95 : 0.85 },
            uAmplitude: { value: 0.035 + Math.random() * 0.035 },
            uExplosion: { value: size * explosionScale },
            uProximity: { value: 0 },
            uBoost: { value: 0 },
            uEdgeGlow: { value: shapeType === 'box' ? 1.0 : 0.0 },
            uFogColor: { value: theme.fog.clone() },
            uFogDensity: { value: FOG_DENSITY },
          },
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.3,
      );
      this.scene.add(mesh);
      if (edges) {
        edges.rotation.copy(mesh.rotation);
        this.scene.add(edges);
      }

      const auraMat = this.auraMaterialBase.clone();
      auraMat.color.copy(color);
      const aura = new THREE.Sprite(auraMat);
      aura.position.copy(position);
      this.scene.add(aura);

      this.shapes.push({
        mesh,
        edges,
        aura,
        isAccent,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.003,
        ),
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.12 + Math.random() * 0.15,
        basePosition: position.clone(),
        scale: size,
        hoverStrength: 0,
        color,
        hoverColor,
      });
      this.shapeMeshes.push(mesh);
    }
  }

  private rollShapeType(): ShapeType {
    const roll = Math.random();
    if (roll < 0.4) {
      return 'box';
    }
    if (roll < 0.62) {
      return 'octahedron';
    }
    if (roll < 0.82) {
      return 'tetrahedron';
    }
    return 'torus';
  }

  private pickMobilePosition(
    size: number,
    placed: { pos: THREE.Vector3; size: number }[],
  ): THREE.Vector3 {
    const { shapeX, shapeY } = this.spawnBounds;
    const position = new THREE.Vector3();
    for (let attempt = 0; attempt < 50; attempt++) {
      position.set(
        (Math.random() * 2 - 1) * shapeX,
        (Math.random() * 1.2 - 0.2) * shapeY,
        (Math.random() - 0.5) * 2,
      );
      const overlaps = placed.some((p) => position.distanceTo(p.pos) < (size + p.size) * 0.85);
      if (!overlaps) {
        break;
      }
    }
    return position;
  }

  /** Samples candidates and keeps the one with the most clearance from existing shapes. */
  private pickDesktopPosition(
    regionScale: number,
    size: number,
    placed: { pos: THREE.Vector3; size: number }[],
  ): THREE.Vector3 {
    const { shapeX, shapeY } = this.spawnBounds;
    const best = new THREE.Vector3();
    const candidate = new THREE.Vector3();
    let bestScore = -Infinity;
    for (let c = 0; c < 30; c++) {
      candidate.set(
        ((Math.random() * 2 - 1) * regionScale + 0.1) * shapeX,
        (Math.random() * 2 - 1) * shapeY * regionScale,
        (Math.random() - 0.5) * 2,
      );
      let minClearance = Infinity;
      for (const p of placed) {
        minClearance = Math.min(minClearance, candidate.distanceTo(p.pos) - p.size - size);
      }
      if (minClearance > bestScore) {
        bestScore = minClearance;
        best.copy(candidate);
      }
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // Per-frame steps
  // ---------------------------------------------------------------------------

  private updateCamera(t: number, dtNorm: number): void {
    const { camera, cameraParallax } = this;
    const pointerEase = 1 - Math.exp(-0.10536 * dtNorm);
    const cameraEase = 1 - Math.exp(-0.04082 * dtNorm);
    this.pointerX += (this.targetPointerX - this.pointerX) * pointerEase;
    this.pointerY += (this.targetPointerY - this.pointerY) * pointerEase;

    camera.position.x += (this.pointerX * cameraParallax - camera.position.x) * cameraEase;
    camera.position.y += (-this.pointerY * cameraParallax - camera.position.y) * cameraEase;
    if (this.boost) {
      const shake = 0.18 * dtNorm;
      camera.position.x +=
        (Math.sin(t * 47) * 0.5 + Math.sin(t * 31) * 0.35 + Math.sin(t * 19) * 0.2) * shake;
      camera.position.y +=
        (Math.cos(t * 53) * 0.45 + Math.cos(t * 37) * 0.3 + Math.cos(t * 23) * 0.15) * shake;
      camera.position.z += (Math.sin(t * 41) * 0.15 + Math.cos(t * 29) * 0.1) * shake;
    }
    camera.lookAt(0, 0, 0);
  }

  private updateShapeTransforms(
    t: number,
    dtNorm: number,
    speedMultiplier: number,
    boostAmt: number,
  ): void {
    const chaosX = boostAmt * (Math.sin(t * 8) * 0.15 + Math.cos(t * 11) * 0.1);
    const chaosY = boostAmt * (Math.cos(t * 9) * 0.12 + Math.sin(t * 13) * 0.08);
    const chaosZ = boostAmt * (Math.sin(t * 7) * 0.08);

    for (const shape of this.shapes) {
      const { mesh, rotationSpeed, floatSpeed, floatOffset, basePosition } = shape;
      mesh.rotation.x += rotationSpeed.x * speedMultiplier * dtNorm;
      mesh.rotation.y += rotationSpeed.y * speedMultiplier * dtNorm;
      mesh.rotation.z += rotationSpeed.z * speedMultiplier * dtNorm;

      mesh.position.set(
        basePosition.x + Math.sin(t * floatSpeed + floatOffset) * 0.1 + chaosX,
        basePosition.y + Math.sin(t * floatSpeed * 1.3 + floatOffset) * 0.15 + chaosY,
        basePosition.z + Math.cos(t * floatSpeed * 0.7 + floatOffset) * 0.08 + chaosZ,
      );
      if (shape.edges) {
        shape.edges.position.copy(mesh.position);
        shape.edges.rotation.copy(mesh.rotation);
      }
      shape.aura.position.copy(mesh.position);
    }
  }

  /** Raycasts only when the pointer moved, or periodically so drifting shapes can gain/lose hover. */
  private updateHover(): void {
    if (!this.hoverEnabled) {
      return;
    }
    const pointerIdle = !this.pointerDirty && this.frame % HOVER_RECHECK_FRAMES !== 0;
    if (pointerIdle) {
      return;
    }
    this.pointerDirty = false;

    this.scene.updateMatrixWorld();
    this.pointerNDC.set(this.targetPointerX, -this.targetPointerY);
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hit = this.raycaster.intersectObjects(this.shapeMeshes, false)[0];
    this.hoveredMesh = hit?.object ?? null;
  }

  private updateShapeAppearance(
    t: number,
    dtNorm: number,
    speedMultiplier: number,
    boostAmt: number,
  ): void {
    const boostEase = (this.boost ? 0.12 : 0.06) * dtNorm;

    for (const shape of this.shapes) {
      const hoverTarget = this.hoveredMesh === shape.mesh ? 1 : 0;
      const rising = hoverTarget > shape.hoverStrength;
      const lerpRate = 1 - Math.exp((rising ? -0.05657 : -0.03562) * dtNorm);
      shape.hoverStrength += (hoverTarget - shape.hoverStrength) * lerpRate;
      const proximity = shape.hoverStrength;

      const material = shape.mesh.material;
      if (material instanceof THREE.ShaderMaterial) {
        const u = material.uniforms;
        u.uTime.value = t * speedMultiplier;
        u.uProximity.value = proximity;
        u.uBoost.value += (boostAmt - u.uBoost.value) * boostEase;
      }
      if (shape.edges) {
        (shape.edges.material as THREE.LineBasicMaterial).color.lerpColors(
          shape.color,
          shape.hoverColor,
          proximity,
        );
      }

      const scale = 1 + Math.sin(t * 2 + shape.floatOffset) * 0.02 + proximity * 0.18;
      shape.mesh.scale.setScalar(scale);
      shape.edges?.scale.setScalar(scale);
      shape.aura.scale.setScalar(shape.scale * 4.5 * scale);
      shape.aura.material.opacity = this.auraBaseOpacity + proximity * 0.4;
    }
  }

  /** Rebuilds the line segments between nearby shapes. Returns the number of active pairs. */
  private updateConstellation(t: number): number {
    const { shapes, constellationPositions, constellationColors, constellationDistances } = this;
    let pairIdx = 0;
    for (let a = 0; a < shapes.length; a++) {
      const pa = shapes[a].mesh.position;
      const ca = shapes[a].color;
      for (let b = a + 1; b < shapes.length; b++) {
        const pb = shapes[b].mesh.position;
        const distSq = pa.distanceToSquared(pb);
        if (distSq >= MAX_CONSTELLATION_DIST_SQ) {
          continue;
        }

        const dist = Math.sqrt(distSq);
        const linear = 1.0 - dist / MAX_CONSTELLATION_DIST;
        const strength = linear * linear;
        const cb = shapes[b].color;
        const base = pairIdx * 6;
        pa.toArray(constellationPositions, base);
        pb.toArray(constellationPositions, base + 3);
        constellationColors[base] = ca.r * strength;
        constellationColors[base + 1] = ca.g * strength;
        constellationColors[base + 2] = ca.b * strength;
        constellationColors[base + 3] = cb.r * strength;
        constellationColors[base + 4] = cb.g * strength;
        constellationColors[base + 5] = cb.b * strength;
        // Dash distance along each segment: 0 at the start, segment length at the end.
        constellationDistances[pairIdx * 2] = 0;
        constellationDistances[pairIdx * 2 + 1] = dist;
        this.constellationPairShapes[pairIdx * 2] = a;
        this.constellationPairShapes[pairIdx * 2 + 1] = b;
        pairIdx += 1;
      }
    }
    const geo = this.constellationGeometry;
    geo.setDrawRange(0, pairIdx * 2);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.lineDistance.needsUpdate = true;
    (this.constellationMaterial as THREE.LineDashedMaterial & { dashOffset: number }).dashOffset =
      -t * 0.7;
    return pairIdx;
  }

  private pickRandomSegment(dot: DotTraverser, pairCount: number): void {
    const seg = Math.floor(Math.random() * pairCount);
    const a = this.constellationPairShapes[seg * 2];
    const b = this.constellationPairShapes[seg * 2 + 1];
    const flip = Math.random() < 0.5;
    dot.shapeA = flip ? b : a;
    dot.shapeB = flip ? a : b;
  }

  /**
   * On arrival at a node, continue along a different edge leaving that node.
   * Falls back to bouncing back if that is the only edge, or to a random segment if none.
   */
  private pickNextSegment(dot: DotTraverser, pairCount: number): void {
    const { constellationPairShapes, dotCandidateA, dotCandidateB } = this;
    const node = dot.shapeB;
    const cameFrom = dot.shapeA;
    let count = 0;
    let hasOther = false;
    for (let p = 0; p < pairCount; p++) {
      const sa = constellationPairShapes[p * 2];
      const sb = constellationPairShapes[p * 2 + 1];
      if (sa !== node && sb !== node) {
        continue;
      }
      const next = sa === node ? sb : sa;
      dotCandidateA[count] = node;
      dotCandidateB[count] = next;
      count++;
      if (next !== cameFrom) {
        hasOther = true;
      }
    }
    if (count === 0) {
      this.pickRandomSegment(dot, pairCount);
      return;
    }
    let pick = Math.floor(Math.random() * count);
    if (hasOther) {
      while (dotCandidateB[pick] === cameFrom) {
        pick = (pick + 1) % count;
      }
    }
    dot.shapeA = dotCandidateA[pick];
    dot.shapeB = dotCandidateB[pick];
  }

  private updateDots(pairCount: number, elapsedMs: number, speedMultiplier: number): void {
    const { shapes, dotTraversers, dotPositions } = this;
    if (pairCount > 0) {
      const advance = DOT_SPEED * elapsedMs * 0.001 * speedMultiplier;
      for (let d = 0; d < dotTraversers.length; d++) {
        const dot = dotTraversers[d];
        if (dot.shapeA < 0) {
          this.pickRandomSegment(dot, pairCount);
          dot.t = Math.random();
        } else {
          const pA = shapes[dot.shapeA].mesh.position;
          const pB = shapes[dot.shapeB].mesh.position;
          if (pA.distanceToSquared(pB) >= MAX_CONSTELLATION_DIST_SQ) {
            // The edge we were on broke; hop to a live one.
            this.pickRandomSegment(dot, pairCount);
            dot.t = 0;
          }
        }

        dot.t += advance;
        if (dot.t >= 1) {
          this.pickNextSegment(dot, pairCount);
          dot.t = 0;
        }

        const pA = shapes[dot.shapeA].mesh.position;
        const pB = shapes[dot.shapeB].mesh.position;
        dotPositions[d * 3] = pA.x + (pB.x - pA.x) * dot.t;
        dotPositions[d * 3 + 1] = pA.y + (pB.y - pA.y) * dot.t;
        dotPositions[d * 3 + 2] = pA.z + (pB.z - pA.z) * dot.t;
      }
      this.dotGeometry.attributes.position.needsUpdate = true;
    }
  }

  private updateAmbient(t: number, boost: boolean): void {
    const pulseFreq = boost ? 4.2 : 2.8;
    this.dotMaterial.opacity = 0.82 + 0.12 * Math.sin(t * pulseFreq);
    this.dotMaterial.size = 0.28 + 0.05 * Math.sin(t * pulseFreq);
    this.gridMat.opacity = this.gridBaseOpacity * (0.85 + 0.15 * Math.sin(t * 0.35));

    const particleBoost = boost ? 2.5 : 1;
    const { particles, particlePositions } = this;
    for (let pi = 0; pi < particles.length; pi++) {
      const { basePosition, phase } = particles[pi];
      const px = Math.sin(t * 0.5 + phase) * 0.5;
      const py = Math.cos(t * 0.4 + phase) * 0.5;
      const pz = Math.sin(t * 0.3 + phase) * 0.3;
      const chaos = boost ? Math.sin(t * 6 + phase) * 0.8 + Math.cos(t * 4 + phase * 2) * 0.5 : 0;
      particlePositions[pi * 3] = basePosition.x + px * particleBoost + chaos * 0.3;
      particlePositions[pi * 3 + 1] = basePosition.y + py * particleBoost + chaos * 0.25;
      particlePositions[pi * 3 + 2] = basePosition.z + pz * particleBoost + chaos * 0.2;
    }
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleMaterial.opacity = boost ? 0.65 : 0.4;
  }
}
