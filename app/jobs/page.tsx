"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { FadeInView } from "../components/FadeInView";
import { Footer } from "../components/Footer";
import { MailIcon } from "../components/icons";
import { PageHeader } from "../components/PageHeader";
import { SocialLinks } from "../components/SocialLinks";
import { useTranslation } from "../i18n";

const sections = [
  {
    id: "engineering",
    key: "engineering",
    positions: [
      { key: "unrealEngineer", level: "medior" },
      { key: "unityEngineer", level: "medior" },
      { key: "cppRustEngineer", level: "senior" },
      { key: "backendEngineer", level: "medior" },
    ],
  },
  {
    id: "qa",
    key: "qa",
    positions: [{ key: "qaEngineer", level: "medior" }],
  },
  {
    id: "marketing",
    key: "marketing",
    positions: [{ key: "marketingManager", level: "medior" }],
  },
  {
    id: "it",
    key: "it",
    positions: [{ key: "juniorIt", level: "junior" }],
  },
];

function toAnchorId(sectionId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/c\+\+/g, "cpp")
    .replace(/c#/g, "csharp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${sectionId}-${slug}`;
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

function LinkIcon({ className }: { className?: string }) {
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
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
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

export default function JobsPage() {
  const { t } = useTranslation();
  const email = "marty+jobs@flying-rat.studio";
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const jobsNavItems = sections.map((section) => ({
    id: section.id,
    label: t(`jobs.sections.${section.key}`),
  }));
  const hiringSteps = t("jobs.hiringProcess.steps", {
    returnObjects: true,
  }) as { title: string; description: string }[];

  const handleCopyLink = async (anchorId: string) => {
    const url = `${window.location.origin}/jobs#${anchorId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(anchorId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMailtoUrl = (positionTitle: string) => {
    const subject = encodeURIComponent(`Application: ${positionTitle}`);
    return `mailto:${email}?subject=${subject}`;
  };

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <PageHeader navItems={jobsNavItems} />

      <main className="pt-24 flex-1">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("jobs.title")}</h1>
            <div className="text-lg text-[var(--color-text-secondary)] mb-8 space-y-4">
              <p>{t("jobs.subtitle.intro")}</p>
              <p>{t("jobs.subtitle.culture")}</p>
            </div>
          </div>
        </div>

        <FadeInView animation="scale" className="mb-10">
          <div className="relative overflow-hidden">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />

                  <Image
                    src="/images/team-2.jpg"
                    alt={t("jobs.team.imageAlt")}
                    width={1920}
                    height={1080}
                    className="w-full h-[260px] md:h-[340px] object-cover object-[center_80%] scale-110"
                    priority
                  />

                  <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-5">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(t("jobs.perks", { returnObjects: true }) as string[]).map((perk) => (
                        <span
                          key={perk}
                          className="px-2.5 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium text-white border border-white/30 rounded-full bg-black/40 backdrop-blur-sm shadow-sm"
                        >
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInView>

        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 mb-12">
              <span className="w-3 h-3 mt-1 rounded-full bg-yellow-500 shrink-0 animate-pulse" />
              <p className="text-[var(--color-text-secondary)]">{t("jobs.status")}</p>
            </div>
          </div>
        </div>

        <div className="pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {t("jobs.hiringProcess.title")}
                  </h2>
                  <p className="text-[var(--color-text-muted)] mt-2 max-w-2xl">
                    {t("jobs.hiringProcess.description")}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="space-y-8 relative z-10">
                  {hiringSteps.map((step, index) => {
                    const isLeft = index % 2 === 0;
                    const isLast = index === hiringSteps.length - 1;
                    return (
                      <div
                        key={step.title}
                        className={`relative flex flex-col md:flex-row ${
                          isLeft ? "md:justify-start" : "md:justify-end"
                        }`}
                      >
                        {!isLast && (
                          <div className="timeline-connector absolute left-[19px] sm:left-[27px] md:left-1/2 top-[30px] -translate-x-1/2 w-1.5 h-[calc(100%+2rem)] bg-gradient-to-r from-accent/90 via-accent/60 to-transparent shadow-[0_0_24px_rgba(250,85,101,0.45)] overflow-hidden">
                            <span className="timeline-scanline absolute left-0 right-0 top-0 h-16 bg-gradient-to-b from-transparent via-accent/50 to-transparent opacity-80 blur-[1px]" />
                          </div>
                        )}
                        <span className="absolute left-[19px] sm:left-[27px] md:left-1/2 top-6 -translate-x-1/2 w-3 h-3 rounded-full bg-accent ring-2 ring-accent/30 shadow-[0_0_24px_rgba(250,85,101,0.35)] z-10" />
                        <span
                          className={`absolute left-[19px] sm:left-[27px] md:left-1/2 top-[30px] h-px w-8 md:w-12 ${
                            isLeft
                              ? "md:-translate-x-full bg-gradient-to-l from-accent/70 to-transparent"
                              : "md:translate-x-0 bg-gradient-to-r from-accent/70 to-transparent"
                          }`}
                        />
                        <div
                          className={`pl-12 sm:pl-14 md:pl-0 md:w-[calc(50%-1.5rem)] ${
                            isLeft ? "md:pr-10" : "md:pl-10"
                          }`}
                        >
                          <div className="rounded-2xl border border-[var(--color-border)] border-white/10 bg-[var(--color-surface)]/70 bg-gradient-to-br from-white/5 via-transparent to-accent/5 backdrop-blur-md p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent text-white font-semibold text-sm">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <h3 className="text-lg font-semibold">{step.title}</h3>
                            </div>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[var(--color-text-subtle)] text-sm mt-6 italic">
                  * {t("jobs.hiringProcess.note")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-16 scroll-mt-28">
                <h2 className="text-2xl font-semibold mb-6">{t(`jobs.sections.${section.key}`)}</h2>
                <div className="space-y-4">
                  {section.positions.map((position, index) => {
                    const title = t(`jobs.positions.${position.key}.title`);
                    const anchorId = toAnchorId(section.id, title);
                    const levelColors = {
                      junior: "text-green-400 border-green-400/30 bg-green-400/10",
                      medior: "text-blue-400 border-blue-400/30 bg-blue-400/10",
                      senior: "text-purple-400 border-purple-400/30 bg-purple-400/10",
                    };
                    return (
                      <div
                        key={position.key}
                        id={anchorId}
                        className="group scroll-mt-28 relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 backdrop-blur-sm transition-all duration-300 hover:border-accent/30 hover:bg-[var(--color-surface)]/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent to-accent-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute -right-2 -bottom-6 text-[120px] font-bold text-[var(--color-text)] opacity-[0.03] select-none pointer-events-none leading-none">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="p-8 relative">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h3 className="text-xl font-semibold group-hover:text-accent transition-colors duration-300">
                                  {title}
                                </h3>
                                <span
                                  className={`px-2.5 py-1 text-xs font-medium border rounded-full ${levelColors[position.level as keyof typeof levelColors]}`}
                                >
                                  {t(`jobs.levels.${position.level}`)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(anchorId)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--color-surface-light)] transition-colors cursor-pointer"
                                  title={t("jobs.copyLink")}
                                >
                                  {copiedId === anchorId ? (
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <LinkIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                                <MapPinIcon className="w-4 h-4" />
                                <span>{t("jobs.location")}</span>
                              </div>
                            </div>
                            <a
                              href={getMailtoUrl(title)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/20 active:scale-98 shrink-0"
                            >
                              <MailIcon className="w-4 h-4" />
                              {t("jobs.apply")}
                            </a>
                          </div>
                          <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                            {t(`jobs.positions.${position.key}.description`)}
                          </p>
                          <ul className="flex flex-wrap gap-2.5">
                            {(
                              t(`jobs.positions.${position.key}.points`, {
                                returnObjects: true,
                              }) as string[]
                            ).map((point) => (
                              <li
                                key={point}
                                className="text-sm text-[var(--color-text-muted)] bg-[var(--color-surface-light)]/80 border border-[var(--color-border)] px-3.5 py-1.5 rounded-full transition-colors group-hover:border-accent/20"
                              >
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <section className="py-16 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-accent/10 to-transparent" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                {t("jobs.contact.title")}
              </h2>
              <p className="text-[var(--color-text-muted)] text-base md:text-lg mb-8 max-w-xl mx-auto">
                {t("jobs.contact.description")}
              </p>

              <div className="flex flex-col items-center gap-4 mb-10">
                <div className="relative hover:scale-105 transition-transform">
                  <Image
                    src="/images/marty.png"
                    alt={t("jobs.martyAlt")}
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
