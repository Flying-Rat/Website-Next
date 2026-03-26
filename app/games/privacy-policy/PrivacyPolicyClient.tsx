"use client";

import type { ReactNode } from "react";

import { SecondaryPageShell } from "../../components/SecondaryPageShell";
import { useTranslation } from "../../i18n";

type Language = "en" | "cs";
type PlatformKey = keyof typeof platformPolicyLinks;

type PolicyCopy = {
  navItems: { id: string; label: string }[];
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    effectiveDateLabel: string;
    lastUpdatedLabel: string;
    effectiveDateValue: string;
    lastUpdatedValue: string;
  };
  sections: {
    introduction: { title: string; paragraphs: string[] };
    whoWeAre: { title: string; paragraphs: string[] };
    dataWeCollect: {
      title: string;
      intro: string;
      analytics: {
        title: string;
        intro: string;
        items: string[];
        outro: string;
      };
      platform: {
        title: string;
        intro: string;
        labels: {
          steam: string;
          playstation: string;
          xbox: string;
          nintendo: string;
        };
      };
    };
    howWeUseData: { title: string; intro: string; items: string[]; outro: string };
    legalBasis: { title: string; paragraphs: string[] };
    dataRetention: { title: string; paragraphs: string[] };
    dataSharing: { title: string; paragraphs: string[] };
    contact: {
      title: string;
      intro: string;
      studioName: string;
      emailLabel: string;
      websiteLabel: string;
    };
    changes: { title: string; paragraphs: string[] };
  };
};

const platformPolicyLinks = {
  steam: "https://store.steampowered.com/privacy_agreement/",
  playstation: "https://www.playstation.com/en-us/legal/privacy-policy/",
  xbox: "https://privacy.microsoft.com/",
  nintendo: "https://www.nintendo.com/en-us/privacy-policy/",
} as const;

const platformPolicyOrder: PlatformKey[] = ["steam", "playstation", "xbox", "nintendo"];
const PRIVACY_EMAIL = "marty+privacy@flying-rat.studio";

const privacyPolicyCopy: Record<Language, PolicyCopy> = {
  en: {
    navItems: [
      { id: "introduction", label: "Introduction" },
      { id: "data-we-collect", label: "Data We Collect" },
      { id: "how-we-use-data", label: "Use of Data" },
      { id: "legal-basis", label: "GDPR" },
      { id: "contact", label: "Contact" },
    ],
    hero: {
      eyebrow: "Flying Rat Studio",
      title: "Privacy Policy",
      description:
        "This page describes how Flying Rat Studio collects, uses, and safeguards information when players use our games on PC and console platforms.",
      effectiveDateLabel: "Effective Date",
      lastUpdatedLabel: "Last Updated",
      effectiveDateValue: "March 2025",
      lastUpdatedValue: "March 2025",
    },
    sections: {
      introduction: {
        title: "1. Introduction",
        paragraphs: [
          'Welcome to Flying Rat Studio ("we", "our", or "us"). We are an independent video game studio committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you play our games on PC or console platforms.',
          "By playing our games, you acknowledge that you have read and understood this Privacy Policy.",
        ],
      },
      whoWeAre: {
        title: "2. Who We Are",
        paragraphs: [
          "Flying Rat Studio is an independent video game developer and publisher. Our games are available on PC and console platforms. For any privacy-related questions, you may contact us at the address provided in Section 8 of this policy.",
        ],
      },
      dataWeCollect: {
        title: "3. Data We Collect",
        intro:
          "We collect limited data to improve our games and understand how players interact with them. We do not collect payment information, and our games do not require account registration directly with us.",
        analytics: {
          title: "3.1 Analytics and Telemetry Data",
          intro:
            "When you play our games, we may automatically collect the following types of analytics and telemetry data:",
          items: [
            "Gameplay statistics (for example levels completed, session duration, and in-game actions)",
            "Game performance metrics (for example frame rate, crash reports, and error logs)",
            "Device and platform information (for example operating system version and hardware specifications)",
            "Game version and build information",
            "Aggregated play patterns and feature usage",
          ],
          outro:
            "All analytics and telemetry data is fully anonymized at the point of collection. We do not assign or store any user identifiers, device identifiers, or any other data that could be used to identify you as an individual. We work exclusively with clean, aggregated data that contains no personal information.",
        },
        platform: {
          title: "3.2 Platform-Provided Data",
          intro:
            "If you play our games via Steam (Valve Corporation) or a console platform (for example PlayStation, Xbox, Nintendo), those platforms may collect additional data under their own privacy policies. We may receive limited, aggregated information from these platforms, such as achievement statistics or crash reports, as permitted by their developer agreements. We encourage you to review the privacy policies of these platforms:",
          labels: {
            steam: "Steam Privacy Policy",
            playstation: "PlayStation Privacy Policy",
            xbox: "Xbox Privacy Policy",
            nintendo: "Nintendo Privacy Policy",
          },
        },
      },
      howWeUseData: {
        title: "4. How We Use Your Data",
        intro: "We use the analytics and telemetry data we collect for the following purposes:",
        items: [
          "To identify and fix bugs, crashes, and performance issues",
          "To understand which features and content players engage with most",
          "To balance gameplay and improve overall game quality",
          "To plan future updates, patches, and new content",
          "To generate aggregated, anonymized reports about game usage",
        ],
        outro:
          "We do not sell, rent, or trade your data to third parties for marketing or advertising purposes.",
      },
      legalBasis: {
        title: "5. Legal Basis for Processing (GDPR)",
        paragraphs: [
          "If you are located in the European Economic Area (EEA) or the United Kingdom, our legal basis for collecting and processing analytics data is our legitimate interest in improving our products and ensuring game quality (Article 6(1)(f) GDPR). Where required by law, we will request your consent before collecting analytics data.",
        ],
      },
      dataRetention: {
        title: "6. Data Retention",
        paragraphs: [
          "We retain analytics and telemetry data only for as long as necessary to fulfill the purposes described in this policy. Aggregated and anonymized data may be retained indefinitely as it can no longer be linked to any individual. When data is no longer needed, we delete or anonymize it.",
        ],
      },
      dataSharing: {
        title: "7. Data Sharing and Third Parties",
        paragraphs: [
          "We may share limited data with trusted third-party service providers who assist us in operating our games and analyzing performance, such as crash reporting and analytics tools. These providers are contractually obligated to keep your data confidential and to use it only on our behalf.",
          "We do not share personal data with third parties.",
        ],
      },
      contact: {
        title: "8. Contact Us",
        intro:
          "If you have any questions, concerns, or requests regarding this Privacy Policy or the data we hold, please contact us at:",
        studioName: "Flying Rat Studio",
        emailLabel: "Email",
        websiteLabel: "Website",
      },
      changes: {
        title: "9. Changes to This Policy",
        paragraphs: [
          'We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make significant changes, we will update the "Last Updated" date at the top of this policy. We encourage you to review this policy periodically. Continued use of our games after any changes constitutes your acceptance of the updated policy.',
        ],
      },
    },
  },
  cs: {
    navItems: [
      { id: "introduction", label: "Úvod" },
      { id: "data-we-collect", label: "Shromažďovaná data" },
      { id: "how-we-use-data", label: "Použití dat" },
      { id: "legal-basis", label: "GDPR" },
      { id: "contact", label: "Kontakt" },
    ],
    hero: {
      eyebrow: "Flying Rat Studio",
      title: "Zásady ochrany soukromí",
      description:
        "Tato stránka popisuje, jak Flying Rat Studio shromažďuje, používá a chrání informace při hraní našich her na PC a konzolových platformách.",
      effectiveDateLabel: "Datum účinnosti",
      lastUpdatedLabel: "Naposledy aktualizováno",
      effectiveDateValue: "Březen 2025",
      lastUpdatedValue: "Březen 2025",
    },
    sections: {
      introduction: {
        title: "1. Úvod",
        paragraphs: [
          'Vítejte ve Flying Rat Studio ("my", "nás" nebo "naše"). Jsme nezávislé videoherní studio a zavazujeme se chránit vaše soukromí. Tyto zásady ochrany soukromí vysvětlují, jak shromažďujeme, používáme a chráníme informace, když hrajete naše hry na PC nebo konzolových platformách.',
          "Hraním našich her potvrzujete, že jste si tyto zásady ochrany soukromí přečetli a rozumíte jim.",
        ],
      },
      whoWeAre: {
        title: "2. Kdo jsme",
        paragraphs: [
          "Flying Rat Studio je nezávislý vývojář a vydavatel videoher. Naše hry jsou dostupné na PC a konzolových platformách. V případě dotazů týkajících se soukromí nás můžete kontaktovat na adrese uvedené v části 8 těchto zásad.",
        ],
      },
      dataWeCollect: {
        title: "3. Jaká data shromažďujeme",
        intro:
          "Shromažďujeme omezené množství dat, abychom mohli naše hry zlepšovat a lépe porozumět tomu, jak s nimi hráči pracují. Neshromažďujeme platební údaje a naše hry nevyžadují registraci účtu přímo u nás.",
        analytics: {
          title: "3.1 Analytická a telemetrická data",
          intro:
            "Při hraní našich her můžeme automaticky shromažďovat následující typy analytických a telemetrických dat:",
          items: [
            "Herní statistiky (například dokončené úrovně, délka relace a akce ve hře)",
            "Metriky výkonu hry (například snímková frekvence, hlášení pádů a chybové logy)",
            "Informace o zařízení a platformě (například verze operačního systému a hardwarové specifikace)",
            "Informace o verzi hry a buildu",
            "Agregované herní vzorce a používání funkcí",
          ],
          outro:
            "Veškerá analytická a telemetrická data jsou plně anonymizována již při sběru. Nepřiřazujeme ani neukládáme žádné uživatelské identifikátory, identifikátory zařízení ani jiná data, která by mohla být použita k vaší identifikaci jako jednotlivce. Pracujeme výhradně s čistými agregovanými daty, která neobsahují osobní údaje.",
        },
        platform: {
          title: "3.2 Data poskytovaná platformami",
          intro:
            "Pokud hrajete naše hry prostřednictvím služby Steam (Valve Corporation) nebo konzolové platformy (například PlayStation, Xbox, Nintendo), mohou tyto platformy shromažďovat další data podle svých vlastních zásad ochrany soukromí. Můžeme od nich získat omezené agregované informace, například statistiky achievementů nebo hlášení pádů, jak to umožňují jejich vývojářské smlouvy. Doporučujeme vám seznámit se se zásadami ochrany soukromí těchto platforem:",
          labels: {
            steam: "Zásady ochrany soukromí služby Steam",
            playstation: "Zásady ochrany soukromí PlayStation",
            xbox: "Zásady ochrany soukromí Xbox",
            nintendo: "Zásady ochrany soukromí Nintendo",
          },
        },
      },
      howWeUseData: {
        title: "4. Jak vaše data používáme",
        intro:
          "Analytická a telemetrická data, která shromažďujeme, používáme pro následující účely:",
        items: [
          "K identifikaci a opravě chyb, pádů a problémů s výkonem",
          "K pochopení toho, které funkce a obsah hráči využívají nejvíce",
          "K vyvažování hratelnosti a zlepšování celkové kvality hry",
          "K plánování budoucích aktualizací, patchů a nového obsahu",
          "K vytváření agregovaných a anonymizovaných přehledů o používání hry",
        ],
        outro:
          "Vaše data neprodáváme, nepronajímáme ani neposkytujeme třetím stranám pro marketingové nebo reklamní účely.",
      },
      legalBasis: {
        title: "5. Právní základ zpracování (GDPR)",
        paragraphs: [
          "Pokud se nacházíte v Evropském hospodářském prostoru (EHP) nebo ve Spojeném království, právním základem pro shromažďování a zpracování analytických dat je náš oprávněný zájem na zlepšování našich produktů a zajištění kvality hry (článek 6 odst. 1 písm. f) GDPR). Pokud to vyžaduje zákon, požádáme vás před shromažďováním analytických dat o souhlas.",
        ],
      },
      dataRetention: {
        title: "6. Doba uchovávání dat",
        paragraphs: [
          "Analytická a telemetrická data uchováváme pouze po dobu nezbytnou k naplnění účelů popsaných v těchto zásadách. Agregovaná a anonymizovaná data mohou být uchovávána neomezeně dlouho, protože je již nelze spojit s žádnou konkrétní osobou. Jakmile data již nejsou potřeba, smažeme je nebo anonymizujeme.",
        ],
      },
      dataSharing: {
        title: "7. Sdílení dat a třetí strany",
        paragraphs: [
          "Můžeme sdílet omezené množství dat s důvěryhodnými poskytovateli služeb třetích stran, kteří nám pomáhají provozovat naše hry a analyzovat jejich výkon, například s nástroji pro analytiku a hlášení pádů. Tito poskytovatelé jsou smluvně zavázáni zachovávat důvěrnost dat a používat je pouze naším jménem.",
          "Osobní údaje s třetími stranami nesdílíme.",
        ],
      },
      contact: {
        title: "8. Kontaktujte nás",
        intro:
          "Pokud máte jakékoli dotazy, obavy nebo žádosti týkající se těchto zásad ochrany soukromí nebo dat, která uchováváme, kontaktujte nás na:",
        studioName: "Flying Rat Studio",
        emailLabel: "E-mail",
        websiteLabel: "Web",
      },
      changes: {
        title: "9. Změny těchto zásad",
        paragraphs: [
          'Tyto zásady ochrany soukromí můžeme čas od času aktualizovat, aby odrážely změny v našich postupech nebo v platných právních předpisech. Pokud provedeme významné změny, aktualizujeme datum "Naposledy aktualizováno" uvedené v horní části této stránky. Doporučujeme vám tyto zásady pravidelně kontrolovat. Pokračováním v používání našich her po provedení změn vyjadřujete souhlas s aktualizovaným zněním zásad.',
        ],
      },
    },
  },
};

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5 sm:rounded-3xl sm:p-6 md:p-8"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--color-text-secondary)] sm:mt-5 sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

function InsetCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-4 sm:rounded-2xl sm:p-5">
      {children}
    </div>
  );
}

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  );
}

export function PrivacyPolicyClient() {
  const { i18n } = useTranslation();
  const currentLang: Language = i18n.language === "cs" ? "cs" : "en";
  const copy = privacyPolicyCopy[currentLang];

  return (
    <SecondaryPageShell navItems={copy.navItems}>
      <div className="container mx-auto px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 sm:rounded-3xl sm:p-8 md:p-10">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {copy.hero.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8">
              {copy.hero.description}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InsetCard>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {copy.hero.effectiveDateLabel}
                </p>
                <p className="mt-2 text-base font-medium">{copy.hero.effectiveDateValue}</p>
              </InsetCard>
              <InsetCard>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {copy.hero.lastUpdatedLabel}
                </p>
                <p className="mt-2 text-base font-medium">{copy.hero.lastUpdatedValue}</p>
              </InsetCard>
            </div>
          </div>

          <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
            <PolicySection id="introduction" title={copy.sections.introduction.title}>
              <Paragraphs paragraphs={copy.sections.introduction.paragraphs} />
            </PolicySection>

            <PolicySection id="who-we-are" title={copy.sections.whoWeAre.title}>
              <Paragraphs paragraphs={copy.sections.whoWeAre.paragraphs} />
            </PolicySection>

            <PolicySection id="data-we-collect" title={copy.sections.dataWeCollect.title}>
              <p>{copy.sections.dataWeCollect.intro}</p>

              <InsetCard>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  {copy.sections.dataWeCollect.analytics.title}
                </h3>
                <p className="mt-3">{copy.sections.dataWeCollect.analytics.intro}</p>
                <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-accent">
                  {copy.sections.dataWeCollect.analytics.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-4">{copy.sections.dataWeCollect.analytics.outro}</p>
              </InsetCard>

              <InsetCard>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  {copy.sections.dataWeCollect.platform.title}
                </h3>
                <p className="mt-3">{copy.sections.dataWeCollect.platform.intro}</p>
                <ul className="mt-4 list-disc space-y-3 break-all pl-5 marker:text-accent sm:break-words">
                  {platformPolicyOrder.map((platform) => (
                    <li key={platform}>
                      {copy.sections.dataWeCollect.platform.labels[platform]}:{" "}
                      <a
                        href={platformPolicyLinks[platform]}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 hover:text-[var(--color-text)]"
                      >
                        {platformPolicyLinks[platform]}
                      </a>
                    </li>
                  ))}
                </ul>
              </InsetCard>
            </PolicySection>

            <PolicySection id="how-we-use-data" title={copy.sections.howWeUseData.title}>
              <p>{copy.sections.howWeUseData.intro}</p>
              <ul className="list-disc space-y-3 pl-5 marker:text-accent">
                {copy.sections.howWeUseData.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{copy.sections.howWeUseData.outro}</p>
            </PolicySection>

            <PolicySection id="legal-basis" title={copy.sections.legalBasis.title}>
              <Paragraphs paragraphs={copy.sections.legalBasis.paragraphs} />
            </PolicySection>

            <PolicySection id="data-retention" title={copy.sections.dataRetention.title}>
              <Paragraphs paragraphs={copy.sections.dataRetention.paragraphs} />
            </PolicySection>

            <PolicySection id="data-sharing" title={copy.sections.dataSharing.title}>
              <Paragraphs paragraphs={copy.sections.dataSharing.paragraphs} />
            </PolicySection>

            <PolicySection id="contact" title={copy.sections.contact.title}>
              <p>{copy.sections.contact.intro}</p>
              <InsetCard>
                <p className="font-semibold text-[var(--color-text)]">
                  {copy.sections.contact.studioName}
                </p>
                <p className="mt-2">
                  {copy.sections.contact.emailLabel}:{" "}
                  <a
                    href={`mailto:${PRIVACY_EMAIL}`}
                    className="underline underline-offset-4 hover:text-[var(--color-text)]"
                  >
                    {PRIVACY_EMAIL}
                  </a>
                </p>
                <p className="mt-1">
                  {copy.sections.contact.websiteLabel}:{" "}
                  <a
                    href="https://www.flying-rat.studio"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-[var(--color-text)]"
                  >
                    www.flying-rat.studio
                  </a>
                </p>
              </InsetCard>
            </PolicySection>

            <PolicySection id="changes" title={copy.sections.changes.title}>
              <Paragraphs paragraphs={copy.sections.changes.paragraphs} />
            </PolicySection>
          </div>
        </div>
      </div>
    </SecondaryPageShell>
  );
}
