"use client";

import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";

import { useTheme } from "../hooks/useTheme";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uExplosion;
  uniform float uProximity;
  uniform float uBoost;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    float wave =
      sin(position.x * 4.2 + uTime * 1.1) *
      cos(position.y * 3.7 + uTime * 0.75) *
      sin(position.z * 3.1 + uTime * 0.55);

    float explodeT = smoothstep(0.0, 1.0, uProximity);
    float waveAmp = uAmplitude * (0.2 + (1.0 - explodeT) * 0.4);
    float tremble = 1.0 + sin(uTime * 7.0) * 0.04 * explodeT;
    float explodeAmt = explodeT * uExplosion * tremble;

    float boost = smoothstep(0.0, 1.0, uBoost);
    float chaos = sin(position.x * 8.0 + uTime * 12.0) * sin(position.y * 7.0 + uTime * 9.0) * sin(position.z * 6.0 + uTime * 11.0);
    float chaosAmp = 0.25 * boost;

    vec3 displaced = position
      + normal * wave * waveAmp
      + normal * explodeAmt
      + normal * chaos * chaosAmp;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHoverColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uProximity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  // Rodrigues rotation around (1,1,1) axis — cheap hue shift
  vec3 hueShift(vec3 c, float shift) {
    float cosA = cos(shift);
    float sinA = sin(shift);
    return c * cosA +
           cross(vec3(0.57735), c) * sinA +
           vec3(0.57735) * dot(vec3(0.57735), c) * (1.0 - cosA);
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);

    float hueAngle = fresnel * 0.6 + uTime * 0.08;
    vec3 rimColor = hueShift(uColor + vec3(0.35), hueAngle);

    vec3 color = mix(uColor * 0.65, rimColor, fresnel);
    color = mix(color, uHoverColor, uProximity);

    float explodeT = smoothstep(0.0, 1.0, uProximity);
    vec3 nDeriv = fwidth(vNormal);
    float edge = smoothstep(0.3, 0.7, length(nDeriv) * 8.0);
    color += uHoverColor * edge * explodeT * 0.6;

    gl_FragColor = vec4(color, uOpacity * (0.45 + fresnel * 0.55));
  }
`;

const EASTER_SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];
const EASTER_SET = new Set(EASTER_SEQUENCE);

interface CubeData {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments | null;
  rotationSpeed: THREE.Vector3;
  floatOffset: number;
  floatSpeed: number;
  basePosition: THREE.Vector3;
  scale: number;
  hoverStrength: number;
  color: THREE.Color;
  baseColor?: THREE.Color;
  hoverColor?: THREE.Color;
}

interface ParticleData {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  phase: number;
}

function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const r = radius - eps;

  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, height - r * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(width - r * 2, height - r * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(width - r * 2, eps, eps, 0, -Math.PI / 2, true);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: segments,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
    curveSegments: segments,
  });

  geometry.center();
  return geometry;
}

export const CubeScene = memo(function CubeScene({
  label,
  shouldAnimate,
  className,
}: {
  label: string;
  shouldAnimate: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [inputKeys, setInputKeys] = useState<Array<{ id: string; key: string }>>([]);
  const [easterActive, setEasterActive] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const boostRef = useRef(false);
  const keysRef = useRef<string[]>([]);
  const keyEntriesRef = useRef<Array<{ id: string; key: string }>>([]);
  const keyIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const easterEmail = "marty+levelup@flying-rat.studio";

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const isLight = resolvedTheme === "light";
    const accent = new THREE.Color(isLight ? 0xe84054 : 0xfa5565);
    const steel = new THREE.Color(isLight ? 0x3a3a3a : 0xd8d8d8);
    const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
    const subdivisions = isMobile ? 6 : 10;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const gridColor = new THREE.Color(isLight ? 0x000000 : 0xffffff);
    const grid = new THREE.GridHelper(28, 28, gridColor, gridColor);
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    (grid.material as THREE.LineBasicMaterial).opacity = isLight ? 0.13 : 0.08;
    grid.position.set(0, -4, -2);
    grid.rotation.x = Math.PI * 0.08;
    scene.add(grid);

    const cubes: CubeData[] = [];
    const placedCubes: { pos: THREE.Vector3; size: number }[] = [];
    const cubeCount = isMobile ? 4 + Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 3);

    const checkOverlap = (pos: THREE.Vector3, size: number): boolean => {
      for (const placed of placedCubes) {
        if (pos.distanceTo(placed.pos) < (size + placed.size) * 0.85) return true;
      }
      return false;
    };

    for (let i = 0; i < cubeCount; i++) {
      const size = i === 0 ? 1.2 + Math.random() * 0.2 : 0.5 + Math.random() * 0.4;
      const isWireframe = i > 1 && Math.random() < 0.4;
      const isAccent = i === 0 || Math.random() < 0.5;

      let position = new THREE.Vector3();
      let attempts = 0;
      do {
        position.set(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 2,
        );
        attempts++;
      } while (checkOverlap(position, size) && attempts < 50);

      placedCubes.push({ pos: position.clone(), size });

      const cubeColor = isAccent ? accent : steel;
      const hoverColor = new THREE.Color(
        Math.min(1, cubeColor.r * 1.5 + 0.35),
        Math.min(1, cubeColor.g * 1.3 + 0.22),
        Math.min(1, cubeColor.b * 1.0 + 0.1),
      );

      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;
      let edges: THREE.LineSegments | null = null;

      if (isWireframe) {
        geometry = createRoundedBoxGeometry(size, size, size, size * 0.08, 2);
        material = new THREE.MeshBasicMaterial({ visible: false });
        edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 40),
          new THREE.LineBasicMaterial({
            color: cubeColor,
            transparent: true,
            opacity: isAccent ? 0.65 : 0.5,
          }),
        );
        edges.position.copy(position);
      } else {
        geometry = new THREE.BoxGeometry(size, size, size, subdivisions, subdivisions, subdivisions);
        material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: cubeColor.clone() },
            uHoverColor: { value: hoverColor },
            uOpacity: { value: isAccent ? 0.82 : 0.68 },
            uAmplitude: { value: 0.035 + Math.random() * 0.035 },
            uExplosion: { value: size * (0.28 + Math.random() * 0.18) },
            uProximity: { value: 0 },
            uBoost: { value: 0 },
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
      scene.add(mesh);

      if (edges) {
        edges.rotation.copy(mesh.rotation);
        scene.add(edges);
      }

      cubes.push({
        mesh,
        edges,
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
        color: cubeColor.clone(),
        ...(edges && { baseColor: cubeColor.clone(), hoverColor }),
      });
    }

    const particles: ParticleData[] = [];
    const particleGeometry = new THREE.CircleGeometry(0.03, 8);
    const particleCount = isMobile ? 4 + Math.floor(Math.random() * 3) : 8 + Math.floor(Math.random() * 6);

    for (let i = 0; i < particleCount; i++) {
      const isAccentParticle = Math.random() < 0.3;
      const particle = new THREE.Mesh(
        particleGeometry,
        new THREE.MeshBasicMaterial({
          color: isAccentParticle ? accent : steel,
          transparent: true,
          opacity: isAccentParticle ? 0.5 : 0.3,
          side: THREE.DoubleSide,
        }),
      );
      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 3 - 2,
      );
      particle.position.copy(basePos);
      scene.add(particle);
      particles.push({ mesh: particle, basePosition: basePos, phase: Math.random() * Math.PI * 2 });
    }
    const cubeMeshes = cubes.map((cube) => cube.mesh);

    const maxPairs = 36;
    const constellationPositions = new Float32Array(maxPairs * 2 * 3);
    const constellationColors = new Float32Array(maxPairs * 2 * 3);
    const constellationGeometry = new THREE.BufferGeometry();
    constellationGeometry.setAttribute("position", new THREE.BufferAttribute(constellationPositions, 3));
    constellationGeometry.setAttribute("color", new THREE.BufferAttribute(constellationColors, 3));
    const constellationMesh = new THREE.LineSegments(
      constellationGeometry,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    scene.add(constellationMesh);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };

    handleResize();
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    });
    resizeObserver.observe(container);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const allowMotion = shouldAnimate && !prefersReducedMotion;

    let animationFrame = 0;
    let running = allowMotion;
    let visible = true;
    let inView = true;
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let lastFrameTime = 0;
    const frameInterval = isMobile ? 1000 / 30 : 1000 / 60;

    const _raycaster = new THREE.Raycaster();
    const _pointerNDC = new THREE.Vector2();

    const animate = (time: number) => {
      if (!running) return;

      const elapsed = time - lastFrameTime;
      if (elapsed < frameInterval) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      // Normalize dt to 60 fps reference so lerp rates are frame-rate independent
      const dtNorm = Math.min(elapsed / 16.667, 3);
      lastFrameTime = time;

      const t = time * 0.001;
      const speedMultiplier = boostRef.current ? 2.5 : 1;

      pointerX += (targetPointerX - pointerX) * (1 - Math.pow(0.9, dtNorm));
      pointerY += (targetPointerY - pointerY) * (1 - Math.pow(0.9, dtNorm));

      camera.position.x += (pointerX * 1.6 - camera.position.x) * (1 - Math.pow(0.96, dtNorm));
      camera.position.y += (-pointerY * 1.6 - camera.position.y) * (1 - Math.pow(0.96, dtNorm));
      if (boostRef.current) {
        const shake = 0.18 * dtNorm;
        camera.position.x += (Math.sin(t * 47) * 0.5 + Math.sin(t * 31) * 0.35 + Math.sin(t * 19) * 0.2) * shake;
        camera.position.y += (Math.cos(t * 53) * 0.45 + Math.cos(t * 37) * 0.3 + Math.cos(t * 23) * 0.15) * shake;
        camera.position.z += (Math.sin(t * 41) * 0.15 + Math.cos(t * 29) * 0.1) * shake;
      }
      camera.lookAt(0, 0, 0);

      _pointerNDC.set(pointerX, -pointerY);
      _raycaster.setFromCamera(_pointerNDC, camera);

      for (const cube of cubes) {
        cube.mesh.rotation.x += cube.rotationSpeed.x * speedMultiplier * dtNorm;
        cube.mesh.rotation.y += cube.rotationSpeed.y * speedMultiplier * dtNorm;
        cube.mesh.rotation.z += cube.rotationSpeed.z * speedMultiplier * dtNorm;

        const floatX = Math.sin(t * cube.floatSpeed + cube.floatOffset) * 0.1;
        const floatY = Math.sin(t * cube.floatSpeed * 1.3 + cube.floatOffset) * 0.15;
        const floatZ = Math.cos(t * cube.floatSpeed * 0.7 + cube.floatOffset) * 0.08;
        const boost = boostRef.current ? 1 : 0;
        const chaosX = boost * (Math.sin(t * 8) * 0.15 + Math.cos(t * 11) * 0.1);
        const chaosY = boost * (Math.cos(t * 9) * 0.12 + Math.sin(t * 13) * 0.08);
        const chaosZ = boost * (Math.sin(t * 7) * 0.08);
        cube.mesh.position.x = cube.basePosition.x + floatX + chaosX;
        cube.mesh.position.y = cube.basePosition.y + floatY + chaosY;
        cube.mesh.position.z = cube.basePosition.z + floatZ + chaosZ;
        if (cube.edges) {
          cube.edges.position.copy(cube.mesh.position);
          cube.edges.rotation.copy(cube.mesh.rotation);
        }
      }
      scene.updateMatrixWorld(true);

      const hit = _raycaster.intersectObjects(cubeMeshes, false)[0];
      const hoveredMesh = hit?.object ?? null;

      for (const cube of cubes) {
        const hoverTarget = hoveredMesh === cube.mesh ? 1 : 0;
        const lerpRate = 1 - Math.pow(hoverTarget > cube.hoverStrength ? 0.945 : 0.965, dtNorm);
        cube.hoverStrength += (hoverTarget - cube.hoverStrength) * lerpRate;
        const proximity = cube.hoverStrength;

        if (cube.mesh.material instanceof THREE.ShaderMaterial) {
          const u = cube.mesh.material.uniforms;
          u.uTime.value = t * speedMultiplier;
          u.uProximity.value = proximity;
          u.uBoost.value += ((boostRef.current ? 1 : 0) - u.uBoost.value) * (boostRef.current ? 0.12 : 0.06) * dtNorm;
        }

        if (cube.edges && cube.baseColor && cube.hoverColor) {
          (cube.edges.material as THREE.LineBasicMaterial).color.lerpColors(
            cube.baseColor,
            cube.hoverColor,
            proximity,
          );
        }

        const scale = 1 + Math.sin(t * 2 + cube.floatOffset) * 0.02 + proximity * 0.18;
        cube.mesh.scale.setScalar(scale);
        cube.edges?.scale.setScalar(scale);
      }

      const maxConstellationDist = 5.5;
      let pairIdx = 0;
      for (let a = 0; a < cubes.length; a++) {
        for (let b = a + 1; b < cubes.length; b++) {
          const dist = cubes[a].mesh.position.distanceTo(cubes[b].mesh.position);
          if (dist < maxConstellationDist) {
            const strength = (1 - dist / maxConstellationDist) ** 2;
            const base = pairIdx * 6;
            const pa = cubes[a].mesh.position;
            const pb = cubes[b].mesh.position;
            constellationPositions[base]     = pa.x; constellationPositions[base + 1] = pa.y; constellationPositions[base + 2] = pa.z;
            constellationPositions[base + 3] = pb.x; constellationPositions[base + 4] = pb.y; constellationPositions[base + 5] = pb.z;
            const ca = cubes[a].color, cb = cubes[b].color;
            constellationColors[base]     = ca.r * strength; constellationColors[base + 1] = ca.g * strength; constellationColors[base + 2] = ca.b * strength;
            constellationColors[base + 3] = cb.r * strength; constellationColors[base + 4] = cb.g * strength; constellationColors[base + 5] = cb.b * strength;
            pairIdx++;
          }
        }
      }
      constellationGeometry.setDrawRange(0, pairIdx * 2);
      constellationGeometry.attributes.position.needsUpdate = true;
      constellationGeometry.attributes.color.needsUpdate = true;

      const particleBoost = boostRef.current ? 2.5 : 1;
      for (const particle of particles) {
        const px = Math.sin(t * 0.5 + particle.phase) * 0.5;
        const py = Math.cos(t * 0.4 + particle.phase) * 0.5;
        const pz = Math.sin(t * 0.3 + particle.phase) * 0.3;
        const chaos = boostRef.current
          ? (Math.sin(t * 6 + particle.phase) * 0.8 + Math.cos(t * 4 + particle.phase * 2) * 0.5)
          : 0;
        particle.mesh.position.x = particle.basePosition.x + px * particleBoost + chaos * 0.3;
        particle.mesh.position.y = particle.basePosition.y + py * particleBoost + chaos * 0.25;
        particle.mesh.position.z = particle.basePosition.z + pz * particleBoost + chaos * 0.2;
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.2 + ((particle.mesh.position.z + 6) / 12) * 0.5;
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    if (allowMotion) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      renderer.render(scene, camera);
    }

    const updateRunning = () => {
      const shouldRun = allowMotion && visible && inView;
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) {
        animationFrame = requestAnimationFrame(animate);
      } else if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
      updateRunning();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
          updateRunning();
        },
        { threshold: 0.1 },
      );
      observer.observe(container);
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        targetPointerX = (x - 0.5) * 2;
        targetPointerY = (y - 0.5) * 2;
      } else {
        targetPointerX = 0;
        targetPointerY = 0;
      }
    };

    const handlePointerLeave = () => {
      targetPointerX = 0;
      targetPointerY = 0;
    };

    if (allowMotion) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerleave", handlePointerLeave);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      observer?.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);

      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      constellationGeometry.dispose();
      (constellationMesh.material as THREE.Material).dispose();

      for (const cube of cubes) {
        cube.mesh.geometry.dispose();
        (cube.mesh.material as THREE.Material).dispose();
        if (cube.edges) {
          cube.edges.geometry.dispose();
          (cube.edges.material as THREE.Material).dispose();
        }
      }
      for (const particle of particles) {
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
      }
      particleGeometry.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [resolvedTheme, shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate) {
      setEasterActive(false);
      document.documentElement.classList.remove("crt-mode");
      boostRef.current = false;
      return;
    }

    const triggerEaster = () => {
      boostRef.current = true;
      setEasterActive(true);
      document.documentElement.classList.add("crt-mode");
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        boostRef.current = false;
        setEasterActive(false);
        document.documentElement.classList.remove("crt-mode");
      }, 5000);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!EASTER_SET.has(key)) return;

      const next = [...keysRef.current, key].slice(-EASTER_SEQUENCE.length);
      keyIdRef.current += 1;
      const nextEntries = [...keyEntriesRef.current, { id: `key-${keyIdRef.current}`, key }].slice(
        -EASTER_SEQUENCE.length,
      );
      const matches =
        next.length === EASTER_SEQUENCE.length &&
        next.every((value, idx) => value === EASTER_SEQUENCE[idx]);
      if (matches) triggerEaster();
      keysRef.current = matches ? [] : next;
      keyEntriesRef.current = matches ? [] : nextEntries;
      setInputKeys(matches ? [] : nextEntries);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setEasterActive(false);
      document.documentElement.classList.remove("crt-mode");
      boostRef.current = false;
    };
  }, [shouldAnimate]);

  return (
    <div
      ref={containerRef}
      className={className ?? "relative h-full w-full overflow-hidden"}
      aria-label={label}
      role="img"
    >
      {easterActive && portalTarget
        ? createPortal(<div className="crt-overlay" aria-hidden="true" />, portalTarget)
        : null}
      {easterActive && (
        <div className="absolute bottom-4 left-4 z-10 max-w-[280px] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-[12px] leading-relaxed text-gray-200 shadow-[0_0_18px_rgba(250,85,101,0.35)] backdrop-blur">
          <p className="font-semibold uppercase tracking-[0.2em] text-white/80">Hey gamer</p>
          <p className="mt-1 text-gray-300/90">
            Sounds like you know your way around. Say hi at{" "}
            <a className="text-white hover:text-white/90" href={`mailto:${easterEmail}`}>
              {easterEmail}
            </a>
            .
          </p>
        </div>
      )}
      {inputKeys.length > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-300 backdrop-blur">
            {inputKeys.map((entry) => (
              <span key={entry.id}>{entry.key.replace("arrow", "")}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
