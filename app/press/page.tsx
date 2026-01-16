"use client";

import Image from "next/image";

import { ContactSection } from "../components/ContactSection";
import {
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  DocumentIcon,
  DownloadIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  UsersIcon,
} from "../components/icons";
import { SecondaryPageShell } from "../components/SecondaryPageShell";
import { useClipboard } from "../hooks/useClipboard";
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

const brandColors = [
  { name: "primary", hex: "#FA5565" },
  { name: "dark", hex: "#E04555" },
  { name: "black", hex: "#0A0A0A" },
  { name: "white", hex: "#FFFFFF" },
];

export default function PressKitPage() {
  const { t } = useTranslation();
  const { copied: copiedBoilerplate, copy: copyBoilerplate } = useClipboard<string>();
  const { copied: copiedColor, copy: copyColor } = useClipboard<string>();
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
    await copyBoilerplate("boilerplate", t("pressKit.about.boilerplate"));
  };

  const handleColorCopy = async (hex: string) => {
    await copyColor(hex);
  };

  return (
    <SecondaryPageShell navItems={pressNavItems}>
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
                {copiedBoilerplate === "boilerplate" ? (
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
                      className="card-hover border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-border-hover)]"
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
                  className="card-hover group p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] cursor-pointer"
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
                    <span className="font-semibold">{t("pressKit.brandName.examples.right1")}</span>
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

      <ContactSection
        titleKey="pressKit.contact.title"
        descriptionKey="pressKit.contact.description"
        martyAltKey="pressKit.martyAlt"
        email={email}
      />
    </SecondaryPageShell>
  );
}
