"use client";

import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";

import { useTheme } from "../hooks/useTheme";
import {
  EASTER_SEQUENCE,
  EASTER_SET,
  type ShapeData,
  type ParticleData,
  type ShapeType,
  createShapeGeometry,
  edgeCreaseAngle,
} from "./ShapeScene/shapeSceneGeometry";
import { vertexShader, fragmentShader } from "./ShapeScene/shapeSceneShaders";

export const ShapeScene = memo(function ShapeScene({
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
    const cameraParallax = isMobile ? 0.95 : 1.6;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const getViewSizeAtZ = (worldZ = 0) => {
      const distance = Math.abs(camera.position.z - worldZ);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const height = 2 * Math.tan(verticalFov / 2) * distance;
      return { width: height * camera.aspect, height };
    };
    const getSpawnBounds = () => {
      const view = getViewSizeAtZ(0);
      const halfWidth = view.width * 0.5;
      const halfHeight = view.height * 0.5;
      const shapeX = Math.max(1.2, halfWidth - (isMobile ? 1.0 : 1.6) - cameraParallax);
      const shapeY = Math.max(1.0, halfHeight - (isMobile ? 1.2 : 1.5));
      const particleX = Math.max(1.6, halfWidth - (isMobile ? 0.35 : 0.8));
      const particleY = Math.max(1.3, halfHeight - (isMobile ? 0.5 : 0.9));
      return { shapeX, shapeY, particleX, particleY };
    };
    const syncViewport = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    syncViewport();
    let spawnBounds = getSpawnBounds();

    const gridColor = new THREE.Color(isLight ? 0x000000 : 0xffffff);
    const grid = new THREE.GridHelper(28, 28, gridColor, gridColor);
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    (grid.material as THREE.LineBasicMaterial).opacity = isLight ? 0.13 : 0.08;
    grid.position.set(0, -4, -2);
    grid.rotation.x = Math.PI * 0.08;
    scene.add(grid);

    const shapes: ShapeData[] = [];
    const placedShapes: { pos: THREE.Vector3; size: number }[] = [];
    const shapeCount = isMobile
      ? 4 + Math.floor(Math.random() * 2)
      : 9 + Math.floor(Math.random() * 3);

    const checkOverlap = (pos: THREE.Vector3, size: number): boolean => {
      for (const placed of placedShapes) {
        if (pos.distanceTo(placed.pos) < (size + placed.size) * 0.85) {
          return true;
        }
      }
      return false;
    };

    for (let i = 0; i < shapeCount; i++) {
      const size = i === 0 ? 1.2 + Math.random() * 0.2 : 0.5 + Math.random() * 0.4;
      const isWireframe = i > 1 && Math.random() < 0.4;
      const isAccent = i === 0 || Math.random() < 0.5;

      const shapeRoll = Math.random();
      const shapeType: ShapeType =
        i === 0
          ? "box"
          : shapeRoll < 0.4
            ? "box"
            : shapeRoll < 0.62
              ? "octahedron"
              : shapeRoll < 0.82
                ? "tetrahedron"
                : "torus";

      let position = new THREE.Vector3();
      let attempts = 0;
      do {
        position.set(
          (Math.random() * 2 - 1) * spawnBounds.shapeX,
          (Math.random() * 2 - 1) * spawnBounds.shapeY,
          (Math.random() - 0.5) * 2,
        );
        attempts++;
      } while (checkOverlap(position, size) && attempts < 50);

      placedShapes.push({ pos: position.clone(), size });

      const shapeColor = isAccent ? accent : steel;
      const hoverColor = new THREE.Color(
        Math.min(1, shapeColor.r * 1.5 + 0.35),
        Math.min(1, shapeColor.g * 1.3 + 0.22),
        Math.min(1, shapeColor.b * 1.0 + 0.1),
      );

      let material: THREE.Material;
      let edges: THREE.LineSegments | null = null;

      const geometry = createShapeGeometry(shapeType, size, isWireframe, subdivisions);

      if (isWireframe) {
        material = new THREE.MeshBasicMaterial({ visible: false });
        edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, edgeCreaseAngle(shapeType)),
          new THREE.LineBasicMaterial({
            color: shapeColor,
            transparent: true,
            opacity: isAccent ? 0.65 : 0.5,
          }),
        );
        edges.position.copy(position);
      } else {
        const explosionScale =
          shapeType === "torus" ? 0.08 + Math.random() * 0.06 : 0.28 + Math.random() * 0.18;
        material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: shapeColor.clone() },
            uHoverColor: { value: hoverColor },
            uOpacity: { value: isAccent ? 0.82 : 0.68 },
            uAmplitude: { value: 0.035 + Math.random() * 0.035 },
            uExplosion: { value: size * explosionScale },
            uProximity: { value: 0 },
            uBoost: { value: 0 },
            uEdgeGlow: { value: shapeType === "box" ? 1.0 : 0.0 },
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

      shapes.push({
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
        color: shapeColor.clone(),
        ...(edges && { baseColor: shapeColor.clone(), hoverColor }),
      });
    }

    const particles: ParticleData[] = [];
    const particleCount = isMobile
      ? 4 + Math.floor(Math.random() * 3)
      : 12 + Math.floor(Math.random() * 6);

    const particlePositions = new Float32Array(particleCount * 3);
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: accent,
      size: 0.06,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlePoints);

    for (let i = 0; i < particleCount; i++) {
      const basePos = new THREE.Vector3(
        (Math.random() * 2 - 1) * spawnBounds.particleX,
        (Math.random() * 2 - 1) * spawnBounds.particleY,
        (Math.random() - 0.5) * 3 - 2,
      );
      particlePositions[i * 3] = basePos.x;
      particlePositions[i * 3 + 1] = basePos.y;
      particlePositions[i * 3 + 2] = basePos.z;
      particles.push({ basePosition: basePos, phase: Math.random() * Math.PI * 2 });
    }
    const shapeMeshes = shapes.map((shape) => shape.mesh);

    const maxPairs = 36;
    const constellationPositions = new Float32Array(maxPairs * 2 * 3);
    const constellationColors = new Float32Array(maxPairs * 2 * 3);
    const constellationGeometry = new THREE.BufferGeometry();
    constellationGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(constellationPositions, 3),
    );
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
      syncViewport();
      spawnBounds = getSpawnBounds();

      for (const shape of shapes) {
        const limitX = Math.max(0.8, spawnBounds.shapeX - shape.scale * 0.5);
        const limitY = Math.max(0.7, spawnBounds.shapeY - shape.scale * 0.5);
        shape.basePosition.x = THREE.MathUtils.clamp(shape.basePosition.x, -limitX, limitX);
        shape.basePosition.y = THREE.MathUtils.clamp(shape.basePosition.y, -limitY, limitY);
        shape.mesh.position.x = shape.basePosition.x;
        shape.mesh.position.y = shape.basePosition.y;
        if (shape.edges) {
          shape.edges.position.x = shape.basePosition.x;
          shape.edges.position.y = shape.basePosition.y;
        }
      }

      for (let pi = 0; pi < particles.length; pi++) {
        const particle = particles[pi];
        particle.basePosition.x = THREE.MathUtils.clamp(
          particle.basePosition.x,
          -spawnBounds.particleX,
          spawnBounds.particleX,
        );
        particle.basePosition.y = THREE.MathUtils.clamp(
          particle.basePosition.y,
          -spawnBounds.particleY,
          spawnBounds.particleY,
        );
        particlePositions[pi * 3] = particle.basePosition.x;
        particlePositions[pi * 3 + 1] = particle.basePosition.y;
      }
      particleGeometry.attributes.position.needsUpdate = true;
    };

    handleResize();
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
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
      if (!running) {
        return;
      }

      const elapsed = time - lastFrameTime;
      if (elapsed < frameInterval) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      const dtNorm = Math.min(elapsed / 16.667, 3);
      lastFrameTime = time;

      const t = time * 0.001;
      const speedMultiplier = boostRef.current ? 2.5 : 1;

      pointerX += (targetPointerX - pointerX) * (1 - Math.pow(0.9, dtNorm));
      pointerY += (targetPointerY - pointerY) * (1 - Math.pow(0.9, dtNorm));

      camera.position.x += (pointerX * cameraParallax - camera.position.x) * (1 - Math.pow(0.96, dtNorm));
      camera.position.y += (-pointerY * cameraParallax - camera.position.y) * (1 - Math.pow(0.96, dtNorm));
      if (boostRef.current) {
        const shake = 0.18 * dtNorm;
        camera.position.x +=
          (Math.sin(t * 47) * 0.5 + Math.sin(t * 31) * 0.35 + Math.sin(t * 19) * 0.2) * shake;
        camera.position.y +=
          (Math.cos(t * 53) * 0.45 + Math.cos(t * 37) * 0.3 + Math.cos(t * 23) * 0.15) * shake;
        camera.position.z += (Math.sin(t * 41) * 0.15 + Math.cos(t * 29) * 0.1) * shake;
      }
      camera.lookAt(0, 0, 0);

      _pointerNDC.set(pointerX, -pointerY);
      _raycaster.setFromCamera(_pointerNDC, camera);

      for (const shape of shapes) {
        shape.mesh.rotation.x += shape.rotationSpeed.x * speedMultiplier * dtNorm;
        shape.mesh.rotation.y += shape.rotationSpeed.y * speedMultiplier * dtNorm;
        shape.mesh.rotation.z += shape.rotationSpeed.z * speedMultiplier * dtNorm;

        const floatX = Math.sin(t * shape.floatSpeed + shape.floatOffset) * 0.1;
        const floatY = Math.sin(t * shape.floatSpeed * 1.3 + shape.floatOffset) * 0.15;
        const floatZ = Math.cos(t * shape.floatSpeed * 0.7 + shape.floatOffset) * 0.08;
        const boost = boostRef.current ? 1 : 0;
        const chaosX = boost * (Math.sin(t * 8) * 0.15 + Math.cos(t * 11) * 0.1);
        const chaosY = boost * (Math.cos(t * 9) * 0.12 + Math.sin(t * 13) * 0.08);
        const chaosZ = boost * (Math.sin(t * 7) * 0.08);
        shape.mesh.position.x = shape.basePosition.x + floatX + chaosX;
        shape.mesh.position.y = shape.basePosition.y + floatY + chaosY;
        shape.mesh.position.z = shape.basePosition.z + floatZ + chaosZ;
        if (shape.edges) {
          shape.edges.position.copy(shape.mesh.position);
          shape.edges.rotation.copy(shape.mesh.rotation);
        }
      }
      scene.updateMatrixWorld(true);

      const hit = _raycaster.intersectObjects(shapeMeshes, false)[0];
      const hoveredMesh = hit?.object ?? null;

      for (const shape of shapes) {
        const hoverTarget = hoveredMesh === shape.mesh ? 1 : 0;
        const lerpRate = 1 - Math.pow(hoverTarget > shape.hoverStrength ? 0.945 : 0.965, dtNorm);
        shape.hoverStrength += (hoverTarget - shape.hoverStrength) * lerpRate;
        const proximity = shape.hoverStrength;

        if (shape.mesh.material instanceof THREE.ShaderMaterial) {
          const u = shape.mesh.material.uniforms;
          u.uTime.value = t * speedMultiplier;
          u.uProximity.value = proximity;
          u.uBoost.value +=
            ((boostRef.current ? 1 : 0) - u.uBoost.value) *
            (boostRef.current ? 0.12 : 0.06) *
            dtNorm;
        }

        if (shape.edges && shape.baseColor && shape.hoverColor) {
          (shape.edges.material as THREE.LineBasicMaterial).color.lerpColors(
            shape.baseColor,
            shape.hoverColor,
            proximity,
          );
        }

        const scale = 1 + Math.sin(t * 2 + shape.floatOffset) * 0.02 + proximity * 0.18;
        shape.mesh.scale.setScalar(scale);
        shape.edges?.scale.setScalar(scale);
      }

      const maxConstellationDist = 5.5;
      let pairIdx = 0;
      for (let a = 0; a < shapes.length; a++) {
        for (let b = a + 1; b < shapes.length; b++) {
          const dist = shapes[a].mesh.position.distanceTo(shapes[b].mesh.position);
          if (dist < maxConstellationDist) {
            const strength = (1 - dist / maxConstellationDist) ** 2;
            const base = pairIdx * 6;
            const pa = shapes[a].mesh.position;
            const pb = shapes[b].mesh.position;
            constellationPositions[base] = pa.x;
            constellationPositions[base + 1] = pa.y;
            constellationPositions[base + 2] = pa.z;
            constellationPositions[base + 3] = pb.x;
            constellationPositions[base + 4] = pb.y;
            constellationPositions[base + 5] = pb.z;
            const ca = shapes[a].color,
              cb = shapes[b].color;
            constellationColors[base] = ca.r * strength;
            constellationColors[base + 1] = ca.g * strength;
            constellationColors[base + 2] = ca.b * strength;
            constellationColors[base + 3] = cb.r * strength;
            constellationColors[base + 4] = cb.g * strength;
            constellationColors[base + 5] = cb.b * strength;
            pairIdx++;
          }
        }
      }
      constellationGeometry.setDrawRange(0, pairIdx * 2);
      constellationGeometry.attributes.position.needsUpdate = true;
      constellationGeometry.attributes.color.needsUpdate = true;

      const particleBoost = boostRef.current ? 2.5 : 1;
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      for (let pi = 0; pi < particles.length; pi++) {
        const particle = particles[pi];
        const px = Math.sin(t * 0.5 + particle.phase) * 0.5;
        const py = Math.cos(t * 0.4 + particle.phase) * 0.5;
        const pz = Math.sin(t * 0.3 + particle.phase) * 0.3;
        const chaos = boostRef.current
          ? Math.sin(t * 6 + particle.phase) * 0.8 + Math.cos(t * 4 + particle.phase * 2) * 0.5
          : 0;
        posAttr.setXYZ(
          pi,
          particle.basePosition.x + px * particleBoost + chaos * 0.3,
          particle.basePosition.y + py * particleBoost + chaos * 0.25,
          particle.basePosition.z + pz * particleBoost + chaos * 0.2,
        );
      }
      posAttr.needsUpdate = true;
      particleMaterial.opacity = boostRef.current ? 0.65 : 0.4;

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
      if (shouldRun === running) {
        return;
      }
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
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      observer?.disconnect();
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      constellationGeometry.dispose();
      (constellationMesh.material as THREE.Material).dispose();

      for (const shape of shapes) {
        shape.mesh.geometry.dispose();
        (shape.mesh.material as THREE.Material).dispose();
        if (shape.edges) {
          shape.edges.geometry.dispose();
          (shape.edges.material as THREE.Material).dispose();
        }
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
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
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        boostRef.current = false;
        setEasterActive(false);
        document.documentElement.classList.remove("crt-mode");
      }, 5000);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!EASTER_SET.has(key)) {
        return;
      }

      const next = [...keysRef.current, key].slice(-EASTER_SEQUENCE.length);
      keyIdRef.current += 1;
      const nextEntries = [...keyEntriesRef.current, { id: `key-${keyIdRef.current}`, key }].slice(
        -EASTER_SEQUENCE.length,
      );
      const matches =
        next.length === EASTER_SEQUENCE.length &&
        next.every((value, idx) => value === EASTER_SEQUENCE[idx]);
      if (matches) {
        triggerEaster();
      }
      keysRef.current = matches ? [] : next;
      keyEntriesRef.current = matches ? [] : nextEntries;
      setInputKeys(matches ? [] : nextEntries);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
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
