'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import { FadeInView } from '../components/FadeInView';
import { ArrowRightIcon, CheckIcon } from '../components/icons';
import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { useScrollFrame } from '../hooks/useScrollFrame';
import { pad2 } from '../utils/pad2';

type Step = { title: string; description: string };

/** Where on the screen (as a fraction of its height) a step counts as reached.
 *  Lower on phones, so the cards still being read are not left faded. */
const TRIGGER = 0.62;
const TRIGGER_SMALL = 0.82;
const SMALL_SCREEN = 768;

export function HiringTimeline({
  steps,
  email,
  martyAlt,
}: {
  steps: Step[];
  email: string;
  martyAlt: string;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const shouldAnimate = useAnimationsEnabled();
  const [reached, setReached] = useState(0);
  // Without motion the whole route is simply shown as travelled.
  const reachedCount = shouldAnimate ? reached : steps.length;

  useScrollFrame(
    () => {
      const list = listRef.current;
      if (!list) {
        return;
      }
      const trigger =
        window.innerHeight * (window.innerWidth < SMALL_SCREEN ? TRIGGER_SMALL : TRIGGER);

      // Measure everything first, then write: alternating the two would make the
      // browser lay the page out again for every rail.
      const fills = [...list.querySelectorAll<HTMLElement>('[data-rail-fill]')];
      const progress = fills.map((fill) => {
        const rect = fill.parentElement?.getBoundingClientRect();
        return rect ? Math.min(1, Math.max(0, (trigger - rect.top) / rect.height)) : 0;
      });
      const count = [...list.querySelectorAll('[data-marker]')].filter((marker) => {
        const rect = marker.getBoundingClientRect();
        return rect.top + rect.height / 2 <= trigger;
      }).length;

      for (const [index, fill] of fills.entries()) {
        fill.style.transform = `scaleY(${progress[index]})`;
      }
      setReached(count);
    },
    { resize: true, enabled: shouldAnimate },
  );

  return (
    <ol ref={listRef} className="relative mx-auto max-w-5xl">
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const isTerminal = isFirst || isLast;
        const onLeft = index % 2 === 0;
        const isReached = index < reachedCount;
        const isCurrent = index === reachedCount - 1;
        const number = pad2(index + 1);

        return (
          <li
            key={step.title}
            className="relative pb-6 pl-14 last:pb-0 md:grid md:grid-cols-2 md:gap-x-24 md:pb-12 md:pl-0"
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute top-8 left-5 h-full w-px -translate-x-1/2 bg-line-strong md:left-1/2"
              >
                <span
                  data-rail-fill
                  className="absolute inset-0 origin-top bg-accent"
                  style={shouldAnimate ? { transform: 'scaleY(0)' } : undefined}
                />
              </span>
            )}

            <span
              aria-hidden="true"
              className={`absolute top-8 hidden h-px w-12 transition-colors duration-700 md:block ${onLeft ? 'right-1/2' : 'left-1/2'} ${
                isReached ? 'bg-accent' : 'bg-line-strong'
              }`}
            />

            <span
              data-marker
              className={`absolute top-3 left-5 z-10 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border font-mono text-xs transition-colors duration-500 md:left-1/2 ${
                isTerminal ? '' : 'md:top-[1.5625rem] md:size-3.5'
              } ${isCurrent ? 'timeline-marker-current' : ''} ${
                isReached
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-line-strong bg-page text-subtle'
              }`}
            >
              {isFirst ? (
                <Image
                  src="/images/marty.webp"
                  alt={martyAlt}
                  width={40}
                  height={40}
                  className="size-full rounded-full object-cover"
                />
              ) : isLast ? (
                <CheckIcon className="size-4" />
              ) : (
                <span className="md:hidden">{number}</span>
              )}
            </span>

            <FadeInView
              animation={onLeft ? 'left' : 'right'}
              margin="-60px"
              className={`md:row-start-1 ${onLeft ? 'md:col-start-1' : 'md:col-start-2'}`}
            >
              <div
                className={`surface-card p-5 transition-[opacity,border-color] duration-700 md:p-6 ${
                  // Steps ahead are dimmed, but only as far as their text stays readable.
                  isReached ? 'opacity-100' : 'opacity-85'
                } ${
                  // The last stop keeps its coral frame whether or not it is the current one.
                  isLast
                    ? 'border-accent/50 bg-accent/[0.06]'
                    : isCurrent
                      ? 'border-line-strong'
                      : ''
                }`}
              >
                <h3 className="font-display text-lg font-semibold md:text-xl">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-pretty text-muted">{step.description}</p>
                {isFirst && (
                  <>
                    {/* A pill from sm up; on phones a plain link that can wrap, since the
                        address is wider than a narrow card. */}
                    <a
                      href={`mailto:${email}`}
                      className="text-link mt-1 -mb-2 inline-block py-2 font-mono text-meta break-all sm:hidden"
                    >
                      {email}
                    </a>
                    <a
                      href={`mailto:${email}`}
                      className="btn btn-sm btn-secondary mt-4 hidden font-mono text-meta sm:inline-flex"
                    >
                      {email}
                      <ArrowRightIcon className="btn-arrow size-3.5 shrink-0" />
                    </a>
                  </>
                )}
              </div>
            </FadeInView>

            <span
              aria-hidden="true"
              className={`font-display hidden text-7xl leading-none font-semibold transition-colors duration-700 select-none md:row-start-1 md:block lg:text-8xl ${
                onLeft ? 'md:col-start-2' : 'md:col-start-1 md:text-right'
              } ${isCurrent ? 'text-accent' : isReached ? 'text-ink' : 'text-surface-lighter'}`}
            >
              {number}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
