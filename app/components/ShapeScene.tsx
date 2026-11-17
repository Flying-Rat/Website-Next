'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { VIEW_MODES } from './ShapeScene/shapeSceneConstants';
import { type SceneStats, ShapeSceneRuntime } from './ShapeScene/ShapeSceneRuntime';
import { readSceneTheme } from './ShapeScene/shapeSceneTheme';
import { useEasterEgg } from './ShapeScene/useEasterEgg';

const EASTER_EMAIL = 'marty+levelup@flying-rat.studio';
const RESIZE_DEBOUNCE_MS = 100;
/**
 * The limiter exists to skip frames on fast displays (every other one at 120 Hz), not
 * to hold an exact rate. Display frames do not land on an exact grid, so it only asks
 * for most of a target frame to have passed; demanding all of it would reject frames
 * that arrive a hair early and halve the rate on an ordinary 60 Hz screen.
 */
const FRAME_SPACING = 0.6;

const numberFormat = new Intl.NumberFormat('en-US');

/** Everything here is read back from the renderer each half second, not typed in. */
function formatStats(stats: SceneStats): string {
  const parts = [
    `${stats.drawCalls} draw call${stats.drawCalls === 1 ? '' : 's'}`,
    `${numberFormat.format(stats.instances)} instances`,
    `${numberFormat.format(stats.triangles)} tris`,
  ];
  if (stats.cpuMs > 0) {
    parts.push(`${stats.cpuMs.toFixed(2)} ms CPU`);
  }
  return parts.join(' \u00B7 ');
}

export const ShapeScene = memo(function ShapeScene({
  label,
  shouldAnimate,
  className,
  hudTarget,
}: {
  label: string;
  shouldAnimate: boolean;
  className?: string;
  /** Where to mount the view-mode controls; they are skipped until it exists. */
  hudTarget?: HTMLElement | null;
}) {
  const statsRef = useRef<HTMLParagraphElement | null>(null);
  const [mode, setMode] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<ShapeSceneRuntime | null>(null);
  const { active: easterActive, inputKeys, boostRef } = useEasterEgg(shouldAnimate);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => setPortalTarget(document.body));
  }, []);

  // Build the scene once; it survives theme and motion-preference changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const runtime = new ShapeSceneRuntime(container, {
      isMobile: window.innerWidth < 768 || 'ontouchstart' in window,
      theme: readSceneTheme(),
      onModeChange: setMode,
      onStats: (stats) => {
        if (statsRef.current) {
          statsRef.current.textContent = formatStats(stats);
        }
      },
    });
    runtimeRef.current = runtime;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        runtime.resize();
        runtime.render();
      }, RESIZE_DEBOUNCE_MS);
    });
    resizeObserver.observe(container);

    // Follow the page theme by watching the class on <html> itself. The theme
    // provider flips that class in an effect that runs after this component's, so
    // re-reading the colours whenever the theme *value* changes would pick up the
    // outgoing theme every time and leave the scene one switch behind.
    const root = document.documentElement;
    let isLight = root.classList.contains('light');
    const themeObserver = new MutationObserver(() => {
      const nowLight = root.classList.contains('light');
      if (nowLight !== isLight) {
        isLight = nowLight;
        runtime.setTheme(readSceneTheme());
        runtime.render();
      }
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const runtime = runtimeRef.current;
    if (!container || !runtime) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!shouldAnimate || prefersReducedMotion) {
      runtime.render();
      return;
    }

    const minFrameMs = (1000 / (runtime.isMobile ? 30 : 60)) * FRAME_SPACING;
    let running = false;
    let visible = document.visibilityState === 'visible';
    let inView = true;
    let animationFrame = 0;
    let lastFrameTime = 0;

    const animate = (time: number) => {
      if (!running) {
        return;
      }
      const elapsed = time - lastFrameTime;
      if (elapsed >= minFrameMs) {
        lastFrameTime = time;
        runtime.boost = boostRef.current;
        runtime.update(elapsed);
      }
      animationFrame = requestAnimationFrame(animate);
    };

    const updateRunning = () => {
      const shouldRun = visible && inView;
      if (shouldRun === running) {
        return;
      }
      running = shouldRun;
      if (running) {
        lastFrameTime = performance.now();
        animationFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrame);
      }
    };

    const handleVisibility = () => {
      visible = document.visibilityState === 'visible';
      updateRunning();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const intersection = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        updateRunning();
      },
      { threshold: 0.1 },
    );
    intersection.observe(container);

    updateRunning();

    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', handleVisibility);
      intersection.disconnect();
    };

    // The terrain only follows a real cursor: touch input would just make it twitch.
    if (!window.matchMedia('(hover: hover)').matches) {
      return stopLoop;
    }

    // The container rect is cached and only re-read after scroll or resize,
    // so pointer events don't force layout.
    let rect: DOMRect | null = null;
    const invalidateRect = () => {
      rect = null;
    };
    const handlePointerMove = (event: PointerEvent) => {
      rect ??= container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        runtime.setPointer((x - 0.5) * 2, (y - 0.5) * 2);
      } else {
        runtime.clearPointer();
      }
    };
    const handlePointerLeave = () => runtime.clearPointer();

    // `pointerleave` does not bubble, so it has to be heard on the root element to
    // know when the cursor has left the page.
    const root = document.documentElement;
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    root.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('scroll', invalidateRect, { passive: true });
    window.addEventListener('resize', invalidateRect, { passive: true });

    return () => {
      stopLoop();
      window.removeEventListener('pointermove', handlePointerMove);
      root.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('scroll', invalidateRect);
      window.removeEventListener('resize', invalidateRect);
    };
  }, [shouldAnimate, boostRef]);

  const selectMode = (next: number) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }
    const still = !shouldAnimate || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    runtime.setMode(next, true, still);
    if (still) {
      runtime.render();
    }
  };

  return (
    <div className={className ?? 'relative h-full w-full overflow-hidden'}>
      <div
        ref={containerRef}
        className="scene-enter absolute inset-0"
        aria-label={label}
        role="img"
      />
      {hudTarget
        ? createPortal(
            <div className="scene-hud scene-enter-late">
              <div className="scene-modes" role="group" aria-label="Render view">
                {VIEW_MODES.map((name, index) => (
                  <button
                    key={name}
                    type="button"
                    className="scene-mode"
                    aria-pressed={mode === index}
                    onClick={() => selectMode(index)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p ref={statsRef} className="scene-stats" aria-hidden="true" />
            </div>,
            hudTarget,
          )
        : null}
      {easterActive && portalTarget
        ? createPortal(<div className="crt-overlay" aria-hidden="true" />, portalTarget)
        : null}
      {easterActive && (
        <div className="absolute bottom-4 left-4 z-10 max-w-[280px] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-[12px] leading-relaxed text-zinc-200 shadow-[0_0_18px_rgba(250,85,101,0.35)] backdrop-blur">
          <p className="font-semibold tracking-[0.2em] text-white/80 uppercase">Hey gamer</p>
          <p className="mt-1 text-zinc-300/90">
            Sounds like you know your way around. Say hi at{' '}
            <a className="text-white hover:text-white/90" href={`mailto:${EASTER_EMAIL}`}>
              {EASTER_EMAIL}
            </a>
            .
          </p>
        </div>
      )}
      {inputKeys.length > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] tracking-[0.2em] text-zinc-300 uppercase backdrop-blur">
            {inputKeys.map((entry) => (
              <span key={entry.id}>{entry.key.replace('arrow', '')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
