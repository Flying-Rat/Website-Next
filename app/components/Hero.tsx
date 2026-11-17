'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';

import { useAnimationsEnabled } from '../hooks/useAnimationsEnabled';
import { useTranslation } from '../i18n';
import { ArrowRightIcon } from './icons';
import { LabelledList } from './LabelledList';
import { UnlockToast } from './UnlockToast';

const trustedStudios = ['Meta', 'Red Hook Studios', '3D Realms', 'Bohemia Incubator'];

const pragueClock = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Prague',
});

function subscribeToClock(onTick: () => void) {
  const interval = setInterval(onTick, 15_000);
  return () => clearInterval(interval);
}

const getPragueTime = () => pragueClock.format(new Date());
/** The server cannot know when the page will be read, so it prints no time. */
const getServerTime = () => null;

function usePragueTime() {
  return useSyncExternalStore(subscribeToClock, getPragueTime, getServerTime);
}

function reveal(delayMs: number, distance = 20) {
  return {
    '--reveal-delay': `${delayMs}ms`,
    '--reveal-duration': '1s',
    '--reveal-from': `translateY(${distance}px)`,
  } as CSSProperties;
}

export function Hero() {
  const { t } = useTranslation();
  const shouldAnimate = useAnimationsEnabled();
  const pragueTime = usePragueTime();

  return (
    <section id="hero" className="hero relative pt-28 sm:pt-32 md:pt-40 lg:pt-44">
      <div className="container">
        {/* Source order is headline, copy, photo; small screens show the photo
            second so the headline can stand in it. */}
        <div className="hero-grid flex flex-col">
          <h1
            className="hero-title reveal-on-load pointer-events-none relative z-10 order-1"
            style={reveal(0, 28)}
          >
            {t('hero.tagline')}
          </h1>

          <div
            className="hero-aside reveal-on-load order-3 mt-7 lg:order-2 lg:mt-0"
            style={reveal(140)}
          >
            <p className="eyebrow flex items-baseline justify-between gap-4">
              <span>{t('hero.place')}</span>
              <time className="text-muted tabular-nums">{pragueTime ?? '--:--'}</time>
            </p>
            <p className="hero-lede mt-4 max-w-xl text-pretty">{t('hero.subtitle')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#projects" className="btn btn-primary">
                {t('hero.cta.projects')}
                <ArrowRightIcon className="btn-arrow size-4" />
              </a>
              <a href="#contact" className="btn btn-secondary">
                {t('hero.cta.contact')}
              </a>
            </div>
          </div>

          <div className="hero-photo relative order-2 lg:order-3 lg:col-span-2">
            <div className="hero-photo-crop">
              {/* Light theme only: the part of the headline that stands in the photo,
                  redrawn in the accent colour and clipped by the photo's own frame. */}
              <span
                className="hero-title hero-title-echo reveal-on-load"
                style={reveal(0, 28)}
                aria-hidden="true"
              >
                {t('hero.tagline')}
              </span>
              <Image
                src="/images/team.webp"
                alt={t('hero.photoAlt')}
                width={2047}
                height={1166}
                className="hero-photo-image"
                preload
                // Phones show the photo wider than the screen, but hinting its true
                // width makes 3x screens fetch the 1920px file; one screen-width is
                // still over twice their pixel density and nearly half the bytes.
                sizes="(max-width: 1536px) 100vw, 1536px"
              />
            </div>
            <UnlockToast
              label={t('hero.unlocked')}
              linkLabel={t('hero.cta.projects')}
              animate={shouldAnimate}
            />
          </div>
        </div>

        <LabelledList
          label={t('hero.trustedBy')}
          items={trustedStudios}
          prominent
          className="reveal-on-load pt-10 lg:pt-8"
          style={reveal(360, 12)}
        />
      </div>
    </section>
  );
}
