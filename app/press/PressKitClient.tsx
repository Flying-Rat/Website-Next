'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { ContactSection, FOUNDER } from '../components/ContactSection';
import {
  CheckIcon,
  CopyIcon,
  CrossIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from '../components/icons';
import { SecondaryPageShell } from '../components/SecondaryPageShell';
import { SplitSection } from '../components/SplitSection';
import { projects } from '../data/projects';
import { useClipboard } from '../hooks/useClipboard';
import { useTranslation } from '../i18n';

const PRESS_EMAIL = 'marty+press@flying-rat.studio';
const LOGO_ARCHIVE = '/press-kit/flying-rat-logos.zip';
const HQ_MAP_URL = 'https://maps.app.goo.gl/gDb9wdRiCzYyqPgD8';
// Storefront-style entries that are not platforms a journalist would list.
const NON_PLATFORMS = new Set(['Demo', 'Website']);

const logos = [
  {
    name: 'center',
    variants: [
      {
        color: 'black',
        png: 'RGB_PNG_fr_center_black.png',
        svg: 'RGB_SVG_fr_center_black.svg',
        bgClass: 'bg-white',
      },
      {
        color: 'gray',
        png: 'RGB_PNG_fr_center_gray.png',
        svg: 'RGB_SVG_fr_center_gray.svg',
        bgClass: 'bg-white',
      },
      {
        color: 'white',
        png: 'RGB_PNG_fr_center_white.png',
        svg: 'RGB_SVG_fr_center_white.svg',
        bgClass: 'bg-neutral-900',
      },
    ],
  },
  {
    name: 'horizontal',
    variants: [
      {
        color: 'black',
        png: 'RGB_PNG_fr_horizontal_black.png',
        svg: 'RGB_SVG_fr_horizontal_black.svg',
        bgClass: 'bg-white',
      },
      {
        color: 'gray',
        png: 'RGB_PNG_fr_horizontal_gray.png',
        svg: 'RGB_SVG_fr_horizontal_gray.svg',
        bgClass: 'bg-white',
      },
      {
        color: 'white',
        png: 'RGB_PNG_fr_horizontal_white.png',
        svg: 'RGB_SVG_fr_horizontal_white.svg',
        bgClass: 'bg-neutral-900',
      },
    ],
  },
];

const brandColors = [
  { name: 'primary', hex: '#FA5565' },
  { name: 'dark', hex: '#E04555' },
  { name: 'black', hex: '#0A0A0A' },
  { name: 'white', hex: '#FFFFFF' },
];

function PressAboutSection() {
  const { t } = useTranslation();
  const { copied, copy } = useClipboard<string>();

  return (
    <SplitSection id="about" title={t('pressKit.about.title')}>
      <p className="text-lg leading-relaxed text-pretty text-ink md:text-xl md:leading-relaxed">
        {t('pressKit.about.boilerplate')}
      </p>
      <button
        type="button"
        onClick={() => copy('boilerplate', t('pressKit.about.boilerplate'))}
        className="btn btn-sm btn-secondary mt-6"
      >
        {copied === 'boilerplate' ? (
          <>
            <CheckIcon className="size-4 text-online-ink" />
            {t('pressKit.about.copied')}
          </>
        ) : (
          <>
            <CopyIcon className="size-4" />
            {t('pressKit.about.copyButton')}
          </>
        )}
      </button>
    </SplitSection>
  );
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3.5 sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-6">
      <dt className="eyebrow">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
  );
}

function PressFactSheetSection() {
  const { t } = useTranslation();
  return (
    <SplitSection id="fact-sheet" title={t('pressKit.factSheet.title')}>
      <dl className="border-t border-line">
        <FactRow label={t('pressKit.factSheet.foundedLabel')}>
          {t('pressKit.factSheet.foundedValue')}
        </FactRow>
        <FactRow label={t('pressKit.factSheet.teamSizeLabel')}>
          {t('pressKit.factSheet.teamSizeValue')}
        </FactRow>
        <FactRow label={t('pressKit.factSheet.hqLabel')}>
          <a
            className="text-link inline-flex items-baseline gap-1.5"
            href={HQ_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('pressKit.factSheet.hqValue')}
            <ExternalLinkIcon className="size-3 shrink-0 text-subtle" />
          </a>
        </FactRow>
        <FactRow label={t('pressKit.factSheet.contactLabel')}>
          <a className="text-link -my-1.5 inline-block py-1.5" href={`mailto:${PRESS_EMAIL}`}>
            {PRESS_EMAIL}
          </a>
        </FactRow>
        <FactRow label={t('pressKit.factSheet.legalEntityLabel')}>
          <span className="block">{t('pressKit.factSheet.legalEntityName')}</span>
          <span className="mt-1 block text-md text-muted">
            {t('pressKit.factSheet.legalEntityIds')}
          </span>
          <span className="block text-md text-muted">
            {t('pressKit.factSheet.legalEntityAddress')}
          </span>
          <span className="block text-md text-muted">
            {t('pressKit.factSheet.legalEntityRegistry')}
          </span>
        </FactRow>
      </dl>
    </SplitSection>
  );
}

function PressWorkSection() {
  const { t } = useTranslation();
  return (
    <SplitSection
      id="work"
      title={t('pressKit.work.title')}
      description={t('pressKit.work.description')}
    >
      <ul className="border-t border-line">
        {projects.map((project) => {
          const platforms = project.platforms
            .map((platform) => platform.name)
            .filter((name) => !NON_PLATFORMS.has(name));
          return (
            <li
              key={project.id}
              className="grid gap-x-6 gap-y-1 border-b border-line py-3.5 sm:grid-cols-2 sm:items-baseline md:grid-cols-[1.2fr_1fr_1.1fr]"
            >
              <span className="font-medium text-ink">{project.title}</span>
              <span className="text-muted">{project.studio}</span>
              <span className="font-mono text-xs text-subtle sm:col-span-2 md:col-span-1 md:text-right">
                {platforms.join(' · ')}
              </span>
            </li>
          );
        })}
      </ul>
    </SplitSection>
  );
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      // A proper button on phones; a quiet text link (with a padded hit area) from sm up.
      className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-muted transition-colors hover:text-ink sm:-my-2 sm:h-auto sm:gap-1 sm:rounded-none sm:border-0 sm:px-0 sm:py-2"
    >
      <DownloadIcon className="size-3.5" />
      {label}
    </a>
  );
}

function PressLogosSection() {
  const { t } = useTranslation();
  return (
    <SplitSection
      id="logos"
      title={t('pressKit.logos.title')}
      description={t('pressKit.logos.description')}
    >
      <div className="space-y-10">
        {logos.map((logoGroup) => (
          <div key={logoGroup.name}>
            <h3 className="eyebrow mb-4">{t(`pressKit.logos.${logoGroup.name}`)}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {logoGroup.variants.map((variant) => (
                <div
                  key={variant.png}
                  className="flex overflow-hidden rounded-2xl border border-line sm:block"
                >
                  <div
                    className={`${variant.bgClass} flex aspect-[4/3] w-[42%] shrink-0 items-center justify-center p-4 sm:w-auto sm:p-6`}
                  >
                    <Image
                      src={`/press-kit/company/${variant.png}`}
                      alt={`Flying Rat Studio ${t(`pressKit.logos.${logoGroup.name}`)} - ${t(`pressKit.logoColors.${variant.color}`)}`}
                      width={logoGroup.name === 'horizontal' ? 200 : 110}
                      height={logoGroup.name === 'horizontal' ? 53 : 130}
                      className="h-auto max-h-full max-w-full"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 border-l border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:border-t sm:border-l-0">
                    <span className="text-sm text-ink">
                      {t(`pressKit.logoColors.${variant.color}`)}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-xs sm:gap-4">
                      <DownloadLink
                        href={`/press-kit/company/${variant.svg}`}
                        label={t('pressKit.formats.svg')}
                      />
                      <DownloadLink
                        href={`/press-kit/company/${variant.png}`}
                        label={t('pressKit.formats.png')}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-medium">{t('pressKit.logos.downloadAll')}</h3>
          <p className="mt-1 text-sm text-muted">{t('pressKit.logos.downloadAllDesc')}</p>
        </div>
        <a href={LOGO_ARCHIVE} download className="btn btn-sm btn-secondary shrink-0">
          <DownloadIcon className="size-4" />
          {t('pressKit.formats.zip')}
        </a>
      </div>
    </SplitSection>
  );
}

function PressColorsSection() {
  const { t } = useTranslation();
  const { copied: copiedColor, copy: copyColor } = useClipboard<string>();

  return (
    <SplitSection
      id="colors"
      title={t('pressKit.colors.title')}
      description={t('pressKit.colors.description')}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {brandColors.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => copyColor(color.hex)}
            className="group cursor-pointer text-left"
          >
            <span
              className="block aspect-[4/3] rounded-2xl border border-line-strong transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5"
              style={{ backgroundColor: color.hex }}
            />
            <span className="mt-3 block text-sm font-medium">
              {t(`pressKit.colors.${color.name}`)}
            </span>
            <span className="mt-0.5 block font-mono text-xs text-muted">
              {copiedColor === color.hex ? t('pressKit.colors.copied') : color.hex}
            </span>
          </button>
        ))}
      </div>
    </SplitSection>
  );
}

function RuleList({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'do' | 'dont';
  children: ReactNode;
}) {
  return (
    <div>
      <h3
        className={`eyebrow flex items-center gap-2 ${tone === 'do' ? 'text-online-ink' : 'text-accent-ink'}`}
      >
        {tone === 'do' ? <CheckIcon className="size-3.5" /> : <CrossIcon className="size-3.5" />}
        {title}
      </h3>
      <ul className="mt-3 border-t border-line">{children}</ul>
    </div>
  );
}

function RuleItem({ children }: { children: ReactNode }) {
  return <li className="border-b border-line py-3 text-md text-secondary">{children}</li>;
}

const clearSpaceMarks = [
  'left-1/2 top-0 h-6 -translate-x-1/2 md:h-8',
  'bottom-0 left-1/2 h-6 -translate-x-1/2 md:h-8',
  'left-0 top-1/2 w-6 -translate-y-1/2 md:w-8',
  'right-0 top-1/2 w-6 -translate-y-1/2 md:w-8',
];

function PressGuidelinesSection() {
  const { t } = useTranslation();
  return (
    <SplitSection id="guidelines" title={t('pressKit.guidelines.title')}>
      <figure>
        <div className="flex items-center justify-center rounded-2xl border border-line bg-white p-8 md:p-12">
          <div className="relative border border-dashed border-neutral-300 p-6 md:p-8">
            <Image
              src="/press-kit/company/RGB_PNG_fr_horizontal_black.png"
              alt=""
              width={240}
              height={64}
              className="h-auto w-44 md:w-60"
            />
            {clearSpaceMarks.map((position) => (
              <span
                key={position}
                aria-hidden="true"
                className={`absolute flex items-center justify-center font-mono text-[10px] text-neutral-400 ${position}`}
              >
                F
              </span>
            ))}
          </div>
        </div>
        <figcaption className="mt-4 max-w-2xl text-pretty text-muted">
          <span className="font-medium text-ink">{t('pressKit.clearSpace.title')}.</span>{' '}
          {t('pressKit.clearSpace.description')}
        </figcaption>
      </figure>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <RuleList title={t('pressKit.guidelines.do.title')} tone="do">
          {(['item1', 'item2', 'item3', 'item4'] as const).map((item) => (
            <RuleItem key={item}>{t(`pressKit.guidelines.do.${item}`)}</RuleItem>
          ))}
        </RuleList>
        <RuleList title={t('pressKit.guidelines.dont.title')} tone="dont">
          {(['item1', 'item2', 'item3', 'item4', 'item5', 'item6'] as const).map((item) => (
            <RuleItem key={item}>{t(`pressKit.guidelines.dont.${item}`)}</RuleItem>
          ))}
        </RuleList>
      </div>
    </SplitSection>
  );
}

function PressBrandNameSection() {
  const { t } = useTranslation();
  return (
    <SplitSection
      id="brand-name"
      title={t('pressKit.brandName.title')}
      description={t('pressKit.brandName.description')}
    >
      <p className="eyebrow flex items-center gap-2 text-online-ink">
        <CheckIcon className="size-3.5" />
        {t('pressKit.brandName.correct')}
      </p>
      <p className="font-display mt-3 text-3xl font-semibold md:text-5xl">
        {t('pressKit.brandName.examples.right1')}
      </p>

      <p className="eyebrow mt-10 flex items-center gap-2 text-accent-ink">
        <CrossIcon className="size-3.5" />
        {t('pressKit.brandName.incorrect')}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-lg text-subtle md:text-xl">
        {(['wrong1', 'wrong2', 'wrong3', 'wrong4'] as const).map((key) => (
          <li key={key}>
            <s>{t(`pressKit.brandName.examples.${key}`)}</s>
          </li>
        ))}
      </ul>
    </SplitSection>
  );
}

export function PressKitClient() {
  const { t } = useTranslation();
  const pressNavItems = [
    { id: 'about', label: t('pressKit.nav.about') },
    { id: 'fact-sheet', label: t('pressKit.nav.facts') },
    { id: 'logos', label: t('pressKit.nav.logos') },
    { id: 'colors', label: t('pressKit.nav.colors') },
    { id: 'guidelines', label: t('pressKit.nav.guidelines') },
    { id: 'brand-name', label: t('pressKit.nav.brand') },
  ];

  return (
    <SecondaryPageShell navItems={pressNavItems}>
      <div className="container">
        <div className="grid gap-8 pt-6 pb-12 md:pt-10 md:pb-16 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-7">
            <p className="eyebrow">Flying Rat Studio</p>
            <h1 className="section-title cta-title mt-4">{t('pressKit.title')}</h1>
            <p className="section-subtitle mt-5 max-w-xl">{t('pressKit.subtitle')}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:col-span-5 lg:items-end">
            <a href={LOGO_ARCHIVE} download className="btn btn-primary">
              <DownloadIcon className="size-4" />
              {t('pressKit.logos.downloadAll')}
            </a>
            <a
              href={`mailto:${PRESS_EMAIL}`}
              className="link-underline -my-2 [background-position:0_calc(100%-0.5rem)] py-2 font-mono text-meta text-muted hover:text-ink"
            >
              {PRESS_EMAIL}
            </a>
          </div>
        </div>

        <PressAboutSection />
        <PressFactSheetSection />
        <PressWorkSection />
        <PressLogosSection />
        <PressColorsSection />
        <PressGuidelinesSection />
        <PressBrandNameSection />
      </div>
      <ContactSection
        titleKey="pressKit.contact.title"
        descriptionKey="pressKit.contact.description"
        person={FOUNDER}
        email={PRESS_EMAIL}
      />
    </SecondaryPageShell>
  );
}
