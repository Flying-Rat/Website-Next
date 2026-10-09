'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useTheme } from '../hooks/useTheme';
import { ShapeSceneRuntime } from './ShapeScene/ShapeSceneRuntime';
import { readSceneTheme } from './ShapeScene/shapeSceneTheme';
import { useEasterEgg } from './ShapeScene/useEasterEgg';

const EASTER_EMAIL = 'marty+levelup@flying-rat.studio';
const RESIZE_DEBOUNCE_MS = 100;

/**
 * Decorative Three.js background for the About section. The scene itself lives in
 * `ShapeSceneRuntime`; this component only handles lifecycle, input, and visibility.
 * Load it lazily (see `About`): it pulls in three.js.
 */
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
  const runtimeRef = useRef<ShapeSceneRuntime | null>(null);
  const { resolvedTheme } = useTheme();
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
      hoverEnabled: window.matchMedia('(hover: hover)').matches,
      theme: readSceneTheme(),
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

    return () => {
      resizeObserver.disconnect();
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  // Theme changes swap colors in place instead of rebuilding the WebGL context.
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }
    runtime.setTheme(readSceneTheme());
    runtime.render();
  }, [resolvedTheme]);

  // Render loop, paused when hidden or scrolled out of view.
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

    const frameInterval = runtime.isMobile ? 1000 / 30 : 1000 / 60;
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
      if (elapsed >= frameInterval) {
        lastFrameTime = time;
        runtime.boost = boostRef.current;
        runtime.update(time, elapsed);
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

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('scroll', invalidateRect, { passive: true });
    window.addEventListener('resize', invalidateRect, { passive: true });

    updateRunning();

    return () => {
      running = false;
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', handleVisibility);
      intersection.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('scroll', invalidateRect);
      window.removeEventListener('resize', invalidateRect);
    };
  }, [shouldAnimate, boostRef]);

  return (
    <div
      ref={containerRef}
      className={className ?? 'relative h-full w-full overflow-hidden'}
      aria-label={label}
      role="img"
    >
      {easterActive && portalTarget
        ? createPortal(<div className="crt-overlay" aria-hidden="true" />, portalTarget)
        : null}
      {easterActive && (
        <div className="absolute bottom-4 left-4 z-10 max-w-[280px] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-[12px] leading-relaxed text-zinc-200 shadow-[0_0_18px_rgba(250,85,101,0.35)] backdrop-blur">
          <p className="font-semibold uppercase tracking-[0.2em] text-white/80">Hey gamer</p>
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
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-zinc-300 backdrop-blur">
            {inputKeys.map((entry) => (
              <span key={entry.id}>{entry.key.replace('arrow', '')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
