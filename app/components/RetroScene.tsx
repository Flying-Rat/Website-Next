"use client";

import { memo, useEffect, useRef, useState } from "react";

const CANVAS_SIZE = 220;
const STAR_COUNT = 80;
const STREAK_COUNT = 6;
const RAT_INTERVAL = 8;
const KONAMI_SEQUENCE = [
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
const KONAMI_SET = new Set(KONAMI_SEQUENCE);

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

interface Star {
  x: number;
  y: number;
  z: number;
}

function createStar(): Star {
  return {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random() * 1.2 + 0.1,
  };
}

function resetStar(star: Star) {
  star.x = (Math.random() - 0.5) * 2;
  star.y = (Math.random() - 0.5) * 2;
  star.z = Math.random() * 1.2 + 0.1;
}

function drawFlyingRat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  wingPhase: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const wingY = Math.sin(wingPhase) * 3;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-10, -1, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-12, -3);
  ctx.lineTo(-16, -5);
  ctx.lineTo(-14, -2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-12, -1);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-14, 1);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(6, -1);
  ctx.lineTo(14, 2);
  ctx.lineTo(8, 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.quadraticCurveTo(-12, -14 + wingY, -20, -8 + wingY);
  ctx.quadraticCurveTo(-14, -6 + wingY * 0.5, -4, -2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.quadraticCurveTo(4, -14 + wingY, 14, -8 + wingY);
  ctx.quadraticCurveTo(6, -6 + wingY * 0.5, -2, -2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export const RetroScene = memo(function RetroScene({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [inputKeys, setInputKeys] = useState<Array<{ id: string; key: string }>>([]);
  const boostRef = useRef(false);
  const keysRef = useRef<string[]>([]);
  const keyEntriesRef = useRef<Array<{ id: string; key: string }>>([]);
  const keyIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = CANVAS_SIZE;
    const height = CANVAS_SIZE;
    const horizon = Math.floor(height * 0.42);
    const fov = 80;
    const stars = Array.from({ length: STAR_COUNT }, createStar);
    const streaks = Array.from({ length: STREAK_COUNT }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 0.6,
      z: Math.random() * 1.2 + 0.2,
      speed: 0.05 + Math.random() * 0.08,
    }));

    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, "rgba(10, 10, 12, 1)");
    skyGradient.addColorStop(0.6, "rgba(12, 12, 14, 1)");
    skyGradient.addColorStop(1, "rgba(6, 6, 8, 1)");

    const floorGradient = ctx.createLinearGradient(0, horizon, 0, height);
    floorGradient.addColorStop(0, "rgba(250, 85, 101, 0.08)");
    floorGradient.addColorStop(1, "rgba(250, 85, 101, 0.02)");

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      40,
      width / 2,
      height / 2,
      width,
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.imageSmoothingEnabled = false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrame = 0;
    let lastTime = 0;
    let running = true;
    let visible = true;
    let inView = true;
    let lowPower = false;
    let pointerX = 0;
    let pointerY = 0;

    const drawFrame = (time: number) => {
      const delta = time - lastTime;

      if (!prefersReducedMotion && delta < 16) {
        animationFrame = requestAnimationFrame(drawFrame);
        return;
      }

      lastTime = time;
      const t = time * 0.001;
      const sway = Math.sin(t * 0.6) * 3;
      const hueShift = Math.sin(t * 0.4) * 8;
      const parallaxX = pointerX * 10;
      const parallaxY = pointerY * 6;
      const speedScale = boostRef.current ? 2.6 : 1;

      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.z -= 0.02 * (delta / 16.6);
        if (star.z <= 0.1) {
          resetStar(star);
        }

        const sx = width / 2 + (star.x / star.z) * fov + parallaxX * 0.5;
        const sy = horizon / 2 + (star.y / star.z) * fov + parallaxY * 0.4;

        if (sx < 0 || sx > width || sy < 0 || sy > horizon) {
          resetStar(star);
          continue;
        }

        const brightness = Math.min(1, 1.2 - star.z);
        ctx.fillStyle = `rgba(250, 85, 101, ${brightness})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      for (const streak of streaks) {
        streak.z -= streak.speed * (delta / 16.6);
        if (streak.z <= 0.12) {
          streak.x = (Math.random() - 0.5) * 2;
          streak.y = (Math.random() - 0.5) * 0.6;
          streak.z = Math.random() * 1.2 + 0.2;
          streak.speed = 0.05 + Math.random() * 0.08;
        }

        const sx = width / 2 + (streak.x / streak.z) * fov + parallaxX * 0.7;
        const sy = horizon / 2 + (streak.y / streak.z) * fov + parallaxY * 0.5;

        if (sx < -10 || sx > width + 10 || sy < -10 || sy > horizon + 10) {
          streak.z = 0.11;
          continue;
        }

        const len = Math.min(18, 6 / streak.z);
        const angle = Math.atan2(sy - horizon * 0.5, sx - width / 2);
        const tx = Math.cos(angle) * len;
        const ty = Math.sin(angle) * len;

        ctx.strokeStyle = "rgba(250, 85, 101, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - tx, sy - ty);
        ctx.lineTo(sx + tx, sy + ty);
        ctx.stroke();
      }

      const ratCycle = (t % RAT_INTERVAL) / RAT_INTERVAL;
      if (ratCycle < 0.4) {
        const ratProgress = ratCycle / 0.4;
        const ratX = -30 + ratProgress * (width + 60);
        const ratY = 25 + Math.sin(ratProgress * Math.PI * 3) * 8 + parallaxY * 0.3;
        const ratScale = 0.7 + Math.sin(ratProgress * Math.PI) * 0.15;
        const wingPhase = t * 12;

        drawFlyingRat(ctx, ratX, ratY, ratScale, wingPhase);

        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.beginPath();
        ctx.ellipse(
          ratX + (ratY - horizon) * 0.3,
          horizon + 20,
          12 * ratScale,
          4 * ratScale,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      const pulse = Math.sin(time * 0.0014) * 6;
      const sunX = width / 2 + pulse + sway * 0.4 + parallaxX * 0.4;
      const sunY = horizon - 10 + parallaxY * 0.2;

      const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 60);
      const hs = 350 + hueShift;
      glow.addColorStop(0, `hsla(${hs}, 95%, 70%, 0.8)`);
      glow.addColorStop(0.45, `hsla(${hs}, 95%, 60%, 0.3)`);
      glow.addColorStop(1, "rgba(250, 85, 101, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 18);
      core.addColorStop(0, `hsla(${hs}, 95%, 72%, 0.95)`);
      core.addColorStop(1, `hsla(${hs}, 95%, 60%, 0.55)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();

      const bloom = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 110);
      bloom.addColorStop(0, `hsla(${hs}, 95%, 70%, 0.25)`);
      bloom.addColorStop(1, "rgba(250, 85, 101, 0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(250, 85, 101, 0.12)";
      ctx.fillRect(0, horizon - 2, width, 6);

      ctx.beginPath();
      ctx.moveTo(0, horizon + parallaxY * 0.2);
      const mountainYOffset = horizon + parallaxY * 0.2;
      for (let x = 0; x <= width; x += 18) {
        const peak = Math.sin(t * 0.8 + x * 0.06) * 6;
        ctx.lineTo(x + parallaxX * 0.1, mountainYOffset - 12 + peak);
      }
      ctx.lineTo(width, mountainYOffset);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = floorGradient;
      ctx.fillRect(0, horizon, width, height - horizon);

      ctx.lineWidth = 1;
      const lines = 24;
      const columns = 10;
      const gridParallaxY = parallaxY * 0.2;

      for (let i = 1; i <= lines; i += 1) {
        const depth = i / lines;
        const y = horizon + depth * depth * (height - horizon) + parallaxY * 0.4;
        const wave = Math.sin(t + depth * 8) * 4;
        const lineAlpha = 0.2 + (1 - depth) * 0.5;

        ctx.strokeStyle = `rgba(250, 85, 101, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        ctx.lineTo(width, y + wave);
        ctx.stroke();

        for (let j = -columns; j <= columns; j += 1) {
          const spread = width * 0.75;
          const xTop = width / 2 + (j / columns) * spread + sway * (1 - depth) + parallaxX * 0.2;
          const xBottom =
            width / 2 + ((j / columns) * spread) / (depth + 0.15) + sway * 6 + parallaxX * 0.6;

          ctx.beginPath();
          ctx.moveTo(xTop, gridParallaxY + horizon);
          ctx.lineTo(xBottom, y + wave);
          ctx.stroke();
        }
      }

      // City Silhouette (Black)
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.moveTo(0, mountainYOffset);
      for (let x = 0; x <= width; x += 20) {
        const peak = Math.sin(t * 0.5 + x * 0.08) * 6;
        const heightMod = 10 + (x % 40 === 0 ? 18 : 6);
        ctx.lineTo(x + parallaxX * 0.2, mountainYOffset - heightMod - peak + parallaxY * 0.1);
      }
      ctx.lineTo(width, mountainYOffset);
      ctx.closePath();
      ctx.fill();

      // Road
      const roadTopLeftX = width * 0.44 + sway * 0.6 + parallaxX * 0.2;
      const roadTopRightX = width * 0.56 + sway * 0.6 + parallaxX * 0.2;
      const roadBottomLeftX = width * 0.25 + sway * 2 + parallaxX * 0.4;
      const roadBottomRightX = width * 0.75 + sway * 2 + parallaxX * 0.4;
      const roadTopY = horizon + parallaxY * 0.2;

      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.moveTo(roadBottomLeftX, height);
      ctx.lineTo(roadBottomRightX, height);
      ctx.lineTo(roadTopRightX, roadTopY);
      ctx.lineTo(roadTopLeftX, roadTopY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(250, 85, 101, 0.35)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(250, 85, 101, 0.45)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(roadBottomLeftX, height);
      ctx.lineTo(roadTopLeftX, roadTopY);
      ctx.moveTo(roadBottomRightX, height);
      ctx.lineTo(roadTopRightX, roadTopY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "rgba(250, 85, 101, 0.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i += 1) {
        const z = (t * 0.4 * speedScale + i * 0.22) % 1;
        const depth = 0.15 + (1 - z) * 0.85;
        const y = horizon + depth * depth * (height - horizon) + parallaxY * 0.5;
        const laneWidth = width * (0.012 + depth * 0.05);
        const dashHeight = Math.max(2, (1 - depth) * 12);

        ctx.strokeRect(
          width / 2 - laneWidth / 2 + sway * 1.4 + parallaxX * 0.4,
          y - dashHeight,
          laneWidth,
          dashHeight,
        );
      }

      ctx.fillStyle = "rgba(250, 85, 101, 0.75)";
      ctx.shadowColor = "rgba(250, 85, 101, 0.5)";
      ctx.shadowBlur = 4;
      for (let i = 0; i < 10; i += 1) {
        const z = (t * 0.32 * speedScale + i * 0.18) % 1;
        const depth = 0.2 + (1 - z) * 0.8;
        const y = horizon + depth * depth * (height - horizon) + parallaxY * 0.5;
        const postHeight = Math.max(2, (1 - depth) * 10);
        const xOffset = width * (0.25 + depth * 0.18) + sway * (1 - depth) + parallaxX * 0.2;

        ctx.fillRect(width / 2 - xOffset, y - postHeight, 3, postHeight);
        ctx.fillRect(width / 2 + xOffset, y - postHeight, 3, postHeight);
      }
      ctx.shadowBlur = 0;

      const reflection = ctx.createLinearGradient(0, horizon + 5, 0, height);
      reflection.addColorStop(0, `hsla(${350 + hueShift}, 95%, 60%, 0.25)`);
      reflection.addColorStop(0.5, "rgba(250, 85, 101, 0.06)");
      reflection.addColorStop(1, "rgba(250, 85, 101, 0)");
      ctx.fillStyle = reflection;
      ctx.fillRect(
        width / 2 - 80 + sway + parallaxX * 0.3,
        horizon + 10 + parallaxY * 0.4,
        160,
        height - horizon,
      );

      ctx.fillStyle = "rgba(2, 3, 6, 0.24)";
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }

      const scanAlpha = 0.08 + Math.sin(t * 0.9) * 0.03;
      ctx.fillStyle = `rgba(250, 85, 101, ${scanAlpha})`;
      for (let y = 0; y < height; y += 6) {
        ctx.fillRect(0, y, width, 1);
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      for (let i = 0; i < 80; i += 1) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(250, 85, 101, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, width - 12, height - 12);

      ctx.strokeStyle = "rgba(250, 85, 101, 0.35)";
      ctx.beginPath();
      ctx.moveTo(12, 12);
      ctx.lineTo(28, 12);
      ctx.lineTo(28, 18);
      ctx.moveTo(width - 12, 12);
      ctx.lineTo(width - 28, 12);
      ctx.lineTo(width - 28, 18);
      ctx.moveTo(12, height - 12);
      ctx.lineTo(28, height - 12);
      ctx.lineTo(28, height - 18);
      ctx.moveTo(width - 12, height - 12);
      ctx.lineTo(width - 28, height - 12);
      ctx.lineTo(width - 28, height - 18);
      ctx.stroke();

      if (running && !prefersReducedMotion) {
        animationFrame = requestAnimationFrame(drawFrame);
      }
    };

    const updateRunning = () => {
      const shouldRun = !prefersReducedMotion && visible && inView && !lowPower;
      if (shouldRun === running) {
        return;
      }
      running = shouldRun;
      if (running) {
        lastTime = 0;
        animationFrame = requestAnimationFrame(drawFrame);
      } else if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
      updateRunning();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      pointerX = Math.max(-1, Math.min(1, x * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, y * 2 - 1));
    };

    const handlePointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
          updateRunning();
        },
        { threshold: 0.15 },
      );
      observer.observe(canvas);
    }

    let batteryManager: BatteryManager | null = null;
    const handleBattery = () => {
      if (!batteryManager) {
        return;
      }
      lowPower = !batteryManager.charging && batteryManager.level <= 0.2;
      updateRunning();
    };

    const nav = navigator as unknown as NavigatorWithBattery;
    if (nav.getBattery) {
      nav
        .getBattery()
        .then((battery: BatteryManager) => {
          batteryManager = battery;
          handleBattery();
          batteryManager.addEventListener("levelchange", handleBattery);
          batteryManager.addEventListener("chargingchange", handleBattery);
        })
        .catch(() => {});
    }

    drawFrame(0);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      observer?.disconnect();
      if (batteryManager) {
        batteryManager.removeEventListener("levelchange", handleBattery);
        batteryManager.removeEventListener("chargingchange", handleBattery);
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => {
    const triggerEaster = () => {
      boostRef.current = true;
      document.documentElement.classList.add("crt-mode");
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        boostRef.current = false;
        document.documentElement.classList.remove("crt-mode");
      }, 5000);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!KONAMI_SET.has(key)) {
        return;
      }

      const next = [...keysRef.current, key].slice(-KONAMI_SEQUENCE.length);
      keyIdRef.current += 1;
      const nextEntries = [...keyEntriesRef.current, { id: `key-${keyIdRef.current}`, key }].slice(
        -KONAMI_SEQUENCE.length,
      );
      const matches =
        next.length === KONAMI_SEQUENCE.length &&
        next.every((value, idx) => value === KONAMI_SEQUENCE[idx]);
      const nextKeys = matches ? [] : next;
      const nextKeyEntries = matches ? [] : nextEntries;
      if (matches) {
        triggerEaster();
      }
      keysRef.current = nextKeys;
      keyEntriesRef.current = nextKeyEntries;
      setInputKeys(nextKeyEntries);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      document.documentElement.classList.remove("crt-mode");
      boostRef.current = false;
    };
  }, []);

  return (
    <div className="relative h-full w-full" aria-label={label} role="img">
      {inputKeys.length > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-300 backdrop-blur">
            {inputKeys.map((entry) => (
              <span key={entry.id}>{entry.key.replace("arrow", "")}</span>
            ))}
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full rounded-3xl"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
});
