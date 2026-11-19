'use client';

import { useEffect, useRef } from 'react';

import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { useInView } from '../hooks/useInView';
import { usePageIdle } from '../hooks/usePageIdle';
import { useTranslation } from '../i18n';
import { useAboutDemo } from './aboutDemos';
import { SplitPiece, SplitText } from './aboutDemos/SplitCopy';
import { FadeInView } from './FadeInView';

const aboutStats = [
  { value: 8, suffix: '+', key: 'about.stats.projects' },
  { value: 10, suffix: '+', key: 'about.stats.years' },
  { value: 100, suffix: '%', key: 'about.stats.passion' },
];

const COUNT_UP_MS = 1400;

/**
 * A stat's number. It is rendered at its final value, then counts up from zero
 * the first time it scrolls into view. The count writes straight to the DOM:
 * it ends on the same text React rendered, so the two never disagree.
 */
function StatNumber({ value, animate }: { value: number; animate: boolean }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  // Vertical only: a side margin would hide the first figure on narrow screens.
  const seen = useInView(ref, { once: true, rootMargin: '-60px 0px' });

  useEffect(() => {
    const element = ref.current;
    if (!element || !animate || !seen) {
      return;
    }

    const started = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - started) / COUNT_UP_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = String(Math.round(value * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      element.textContent = String(value);
    };
  }, [value, animate, seen]);

  return <span ref={ref}>{value}</span>;
}

export function About() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();
  const sectionRef = useRef<HTMLElement | null>(null);
  const sceneNear = useInView(sectionRef, { once: true, rootMargin: '600px 0px' });
  // The demo sits just under the hero, so "near" is true almost at once; waiting
  // for the page to settle keeps its download out of the hero's way.
  const pageIdle = usePageIdle();
  const demo = useAboutDemo();
  const copy = useRef<HTMLDivElement>(null);
  const split = Boolean(demo.splitCopy);

  return (
    <section
      ref={sectionRef}
      id="about"
      className={`section-pad relative flex overflow-hidden md:min-h-[680px] md:items-center ${demo.section ?? ''}`}
    >
      {sceneNear && pageIdle && (
        <demo.Component frame={sectionRef} copy={copy} animate={shouldAnimate} />
      )}

      <div className="pointer-events-none relative z-10 container">
        <div className={`md:hidden ${demo.clearance}`} aria-hidden="true" />

        <FadeInView className={`pointer-events-auto max-w-xl ${demo.copyWidth ?? ''}`}>
          <div ref={copy}>
            <h2 className="section-title mb-5 md:mb-7">
              <SplitText text={t('about.title')} by={demo.splitCopy && 'letters'} />
            </h2>
            <div className="section-subtitle space-y-4">
              <p>
                <SplitText text={t('about.description1')} by={demo.splitCopy} />
              </p>
              <p className="text-ink">
                <SplitText text={t('about.description2')} by={demo.splitCopy} />
              </p>
            </div>

            <dl
              data-rule=""
              className="mt-10 grid max-w-md grid-cols-3 border-t border-line md:mt-14"
            >
              {aboutStats.map((stat) => (
                <div
                  key={stat.key}
                  className="relative flex flex-col-reverse justify-end pt-5 before:absolute before:-top-px before:left-0 before:h-0.5 before:w-7 before:bg-accent before:content-['']"
                >
                  <dt className="eyebrow mt-2 pr-3 text-muted">
                    <SplitPiece split={split}>{t(stat.key)}</SplitPiece>
                  </dt>
                  <dd className="font-display text-4xl font-semibold md:text-5xl">
                    <SplitPiece split={split}>
                      <StatNumber value={stat.value} animate={shouldAnimate} />
                      <span className="text-accent">{stat.suffix}</span>
                    </SplitPiece>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
