"use client";

import Image from "next/image";
import { useState } from "react";

import { Footer } from "../components/Footer";
import { ExternalLinkIcon, MailIcon } from "../components/icons";
import { PressHeader } from "../components/PressHeader";
import { SocialLinks } from "../components/SocialLinks";
import { useTranslation } from "../i18n";

const logos = [
  {
    name: "center",
    variants: [
      {
        color: "black",
        png: "RGB_PNG_fr_center_black.png",
        svg: "RGB_SVG_fr_center_black.svg",
        bgClass: "bg-white",
      },
      {
        color: "gray",
        png: "RGB_PNG_fr_center_gray.png",
        svg: "RGB_SVG_fr_center_gray.svg",
        bgClass: "bg-white",
      },
      {
        color: "white",
        png: "RGB_PNG_fr_center_white.png",
        svg: "RGB_SVG_fr_center_white.svg",
        bgClass: "bg-neutral-900",
      },
    ],
  },
  {
    name: "horizontal",
    variants: [
      {
        color: "black",
        png: "RGB_PNG_fr_horizontal_black.png",
        svg: "RGB_SVG_fr_horizontal_black.svg",
        bgClass: "bg-white",
      },
      {
        color: "gray",
        png: "RGB_PNG_fr_horizontal_gray.png",
        svg: "RGB_SVG_fr_horizontal_gray.svg",
        bgClass: "bg-white",
      },
      {
        color: "white",
        png: "RGB_PNG_fr_horizontal_white.png",
        svg: "RGB_SVG_fr_horizontal_white.svg",
        bgClass: "bg-neutral-900",
      },
    ],
  },
];

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3v3M16 3v3M4 9h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"
      />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 13a4 4 0 100-8 4 4 0 000 8zm10-2a3 3 0 100-6 3 3 0 000 6z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20a6 6 0 0112 0m2 0a5 5 0 015 0" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
    </svg>
  );
}

const brandColors = [
  { name: "primary", hex: "#FA5565" },
  { name: "dark", hex: "#E04555" },
  { name: "black", hex: "#0A0A0A" },
  { name: "white", hex: "#FFFFFF" },
];

export default function PressKitPage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const email = "marty+press@flying-rat.studio";
  const pressNavItems = [
    { id: "about", label: t("pressKit.nav.about") },
    { id: "fact-sheet", label: t("pressKit.nav.facts") },
    { id: "logos", label: t("pressKit.nav.logos") },
    { id: "colors", label: t("pressKit.nav.colors") },
    { id: "guidelines", label: t("pressKit.nav.guidelines") },
    { id: "brand-name", label: t("pressKit.nav.brand") },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(t("pressKit.about.boilerplate"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleColorCopy = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <PressHeader navItems={pressNavItems} />

      <main className="pt-24 flex-1">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("pressKit.title")}</h1>
            <p className="text-lg text-[var(--color-text-secondary)] mb-12">
              {t("pressKit.subtitle")}
            </p>

            <section id="about" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold mb-6">{t("pressKit.about.title")}</h2>
              <div className="p-6 surface-card">
                <p className="text-[var(--color-text-secondary)] mb-4">
                  {t("pressKit.about.boilerplate")}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-500" />
                      {t("pressKit.about.copied")}
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      {t("pressKit.about.copyButton")}
                    </>
                  )}
                </button>
              </div>
            </section>

            <section id="fact-sheet" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold mb-6">{t("pressKit.factSheet.title")}</h2>
              <div className="p-6 surface-card">
                <dl className="grid gap-6 md:grid-cols-2">
                  <div className="flex gap-3">
                    <CalendarIcon className="w-4 h-4 mt-1 text-[var(--color-text-muted)]" />
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                        {t("pressKit.factSheet.foundedLabel")}
                      </dt>
                      <dd className="text-[var(--color-text-secondary)]">
                        {t("pressKit.factSheet.foundedValue")}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <UsersIcon className="w-4 h-4 mt-1 text-[var(--color-text-muted)]" />
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                        {t("pressKit.factSheet.teamSizeLabel")}
                      </dt>
                      <dd className="text-[var(--color-text-secondary)]">
                        {t("pressKit.factSheet.teamSizeValue")}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPinIcon className="w-4 h-4 mt-1 text-[var(--color-text-muted)]" />
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                        {t("pressKit.factSheet.hqLabel")}
                      </dt>
                      <dd className="text-[var(--color-text-secondary)]">
                        <a
                          className="inline-flex items-baseline gap-2 underline underline-offset-4"
                          href="https://maps.app.goo.gl/gDb9wdRiCzYyqPgD8"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("pressKit.factSheet.hqValue")}
                          <ExternalLinkIcon className="w-3.5 h-3.5 opacity-60 translate-y-[1px]" />
                        </a>
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MailIcon className="w-4 h-4 mt-1 text-[var(--color-text-muted)]" />
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                        {t("pressKit.factSheet.contactLabel")}
                      </dt>
                      <dd className="text-[var(--color-text-secondary)]">
                        <a className="underline underline-offset-4" href={`mailto:${email}`}>
                          {email}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3 md:col-span-2">
                    <DocumentIcon className="w-4 h-4 mt-1 text-[var(--color-text-muted)]" />
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                        {t("pressKit.factSheet.legalEntityLabel")}
                      </dt>
                      <dd className="text-[var(--color-text-secondary)] space-y-1">
                        <span className="block">{t("pressKit.factSheet.legalEntityName")}</span>
                        <span className="block">{t("pressKit.factSheet.legalEntityIds")}</span>
                        <span className="block">{t("pressKit.factSheet.legalEntityAddress")}</span>
                        <span className="block">{t("pressKit.factSheet.legalEntityRegistry")}</span>
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </section>

            <section id="logos" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold mb-6">{t("pressKit.logos.title")}</h2>
              <p className="text-[var(--color-text-secondary)] mb-8">
                {t("pressKit.logos.description")}
              </p>

              {logos.map((logoGroup) => (
                <div key={logoGroup.name} className="mb-12">
                  <h3 className="text-lg font-medium mb-4 capitalize">
                    {t(`pressKit.logos.${logoGroup.name}`)}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {logoGroup.variants.map((variant) => (
                      <div
                        key={variant.png}
                        className="border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-border-hover)] transition-colors"
                      >
                        <div
                          className={`${variant.bgClass} p-8 flex items-center justify-center min-h-[160px]`}
                        >
                          <Image
                            src={`/press-kit/company/${variant.png}`}
                            alt={`Flying Rat ${t(`pressKit.logos.${logoGroup.name}`)} - ${t(`pressKit.logoColors.${variant.color}`)}`}
                            width={logoGroup.name === "horizontal" ? 200 : 120}
                            height={logoGroup.name === "horizontal" ? 50 : 120}
                            className="max-w-full h-auto"
                          />
                        </div>
                        <div className="p-4 flex items-center justify-between bg-[var(--color-surface)]">
                          <span className="text-sm text-[var(--color-text-secondary)]">
                            {t(`pressKit.logoColors.${variant.color}`)}
                          </span>
                          <div className="flex items-center gap-3">
                            <a
                              href={`/press-kit/company/${variant.svg}`}
                              download
                              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
                            >
                              <DownloadIcon className="w-4 h-4" />
                              {t("pressKit.formats.svg")}
                            </a>
                            <a
                              href={`/press-kit/company/${variant.png}`}
                              download
                              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
                            >
                              <DownloadIcon className="w-4 h-4" />
                              {t("pressKit.formats.png")}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-8 p-6 surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium mb-1">{t("pressKit.logos.downloadAll")}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {t("pressKit.logos.downloadAllDesc")}
                  </p>
                </div>
                <a
                  href="/press-kit/flying-rat-logos.zip"
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:scale-105 active:scale-98"
                >
                  <DownloadIcon className="w-5 h-5" />
                  {t("pressKit.formats.zip")}
                </a>
              </div>
            </section>

            <section id="colors" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold mb-6">{t("pressKit.colors.title")}</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                {t("pressKit.colors.description")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {brandColors.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => handleColorCopy(color.hex)}
                    className="group p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
                  >
                    <div
                      className="w-full aspect-square rounded-lg mb-3 border border-[var(--color-border)]"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="font-medium text-sm">{t(`pressKit.colors.${color.name}`)}</p>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono">
                      {copiedColor === color.hex ? t("pressKit.colors.copied") : color.hex}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section id="guidelines" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold mb-6">{t("pressKit.guidelines.title")}</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                {t("pressKit.clearSpace.description")}
              </p>

              <div className="space-y-6">
                <div className="p-6 surface-card">
                  <h3 className="font-medium mb-3 text-green-500">
                    {t("pressKit.guidelines.do.title")}
                  </h3>
                  <ul className="space-y-2 text-[var(--color-text-secondary)]">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 shrink-0">✓</span>
                      {t("pressKit.guidelines.do.item1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 shrink-0">✓</span>
                      {t("pressKit.guidelines.do.item2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 shrink-0">✓</span>
                      {t("pressKit.guidelines.do.item3")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 shrink-0">✓</span>
                      {t("pressKit.guidelines.do.item4")}
                    </li>
                  </ul>
                </div>

                <div className="p-6 surface-card">
                  <h3 className="font-medium mb-3 text-red-500">
                    {t("pressKit.guidelines.dont.title")}
                  </h3>
                  <ul className="space-y-2 text-[var(--color-text-secondary)]">
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      {t("pressKit.guidelines.dont.item1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      {t("pressKit.guidelines.dont.item2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      {t("pressKit.guidelines.dont.item3")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      {t("pressKit.guidelines.dont.item4")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      {t("pressKit.guidelines.dont.item5")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      {t("pressKit.guidelines.dont.item6")}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="brand-name" className="mb-16 scroll-mt-28">
              <h2 className="text-2xl font-semibold mb-6">{t("pressKit.brandName.title")}</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                {t("pressKit.brandName.description")}
              </p>
              <div className="space-y-6">
                <div className="p-6 surface-card">
                  <h3 className="font-medium mb-3 text-green-500">
                    {t("pressKit.brandName.correct")}
                  </h3>
                  <ul className="space-y-2 text-[var(--color-text-secondary)]">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 shrink-0">✓</span>
                      <span className="font-semibold">
                        {t("pressKit.brandName.examples.right1")}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 surface-card">
                  <h3 className="font-medium mb-3 text-red-500">
                    {t("pressKit.brandName.incorrect")}
                  </h3>
                  <ul className="space-y-2 text-[var(--color-text-secondary)]">
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      <s>{t("pressKit.brandName.examples.wrong1")}</s>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      <s>{t("pressKit.brandName.examples.wrong2")}</s>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      <s>{t("pressKit.brandName.examples.wrong3")}</s>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500 shrink-0">✗</span>
                      <s>{t("pressKit.brandName.examples.wrong4")}</s>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="py-16 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-accent/10 to-transparent" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                {t("pressKit.contact.title")}
              </h2>
              <p className="text-[var(--color-text-muted)] text-base md:text-lg mb-8 max-w-xl mx-auto">
                {t("pressKit.contact.description")}
              </p>

              <div className="flex flex-col items-center gap-4 mb-10">
                <div className="relative hover:scale-105 transition-transform">
                  <Image
                    src="/images/marty.png"
                    alt={t("pressKit.martyAlt")}
                    width={80}
                    height={80}
                    className="avatar-ring"
                  />
                  <div
                    className="absolute -bottom-1 -right-1 status-online"
                    title={t("contact.statusAvailable")}
                  />
                </div>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-accent/30 text-lg hover:scale-105 active:scale-98"
                >
                  <MailIcon className="w-6 h-6" />
                  {t("contact.cta")}
                </a>
                <p className="text-[var(--color-text-subtle)] text-sm">{email}</p>
              </div>

              <p className="text-[var(--color-text-muted)] mb-6">{t("contact.social")}</p>
              <SocialLinks />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
