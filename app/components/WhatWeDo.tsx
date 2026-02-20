"use client";

import { useTranslation } from "../i18n";
import { FadeInView } from "./FadeInView";
import { AiIcon, BackendIcon, EngineeringIcon, PortingIcon, QaIcon, ReleaseIcon } from "./icons";

const whatWeDoItems = [
  { key: "engineering", Icon: EngineeringIcon },
  { key: "porting", Icon: PortingIcon },
  { key: "qa", Icon: QaIcon },
  { key: "release", Icon: ReleaseIcon },
  { key: "backend", Icon: BackendIcon },
  { key: "ai", Icon: AiIcon },
];

function WhatWeDoCard({
  item,
  index,
  t,
}: {
  item: (typeof whatWeDoItems)[0];
  index: number;
  t: (key: string) => string;
}) {
  const title = t(`whatWeDo.${item.key}.title`);
  const body = t(`whatWeDo.${item.key}.body`);
  const Icon = item.Icon;

  return (
    <FadeInView animation="up" delay={index * 0.05} margin="-50px">
      <div className="card-hover group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 backdrop-blur-xl p-5 sm:p-8 transition-colors duration-500 hover:border-accent/20 hover:bg-[var(--color-surface)]/60 h-full">
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-[var(--color-border)]/50 pointer-events-none" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-accent/30 via-accent/5 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="relative shrink-0">
              <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-[var(--color-surface)]/80 border border-[var(--color-border)] flex items-center justify-center text-accent shadow-sm backdrop-blur-md">
                <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--color-text)]">
              {title}
            </h3>
          </div>
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed group-hover:text-[var(--color-text-secondary)] transition-colors duration-300">
            {body}
          </p>
        </div>

        <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-[var(--color-text)]/5 to-transparent rotate-45 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>
    </FadeInView>
  );
}

export function WhatWeDo() {
  const { t } = useTranslation();

  return (
    <section id="what-we-do" className="section-pad relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[var(--color-text)]/5 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <FadeInView animation="up" className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="section-title mb-3 md:mb-4">{t("whatWeDo.title")}</h2>
          <p className="section-subtitle max-w-2xl mx-auto">{t("whatWeDo.subtitle")}</p>
        </FadeInView>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
          {whatWeDoItems.map((item, index) => (
            <WhatWeDoCard key={item.key} item={item} index={index} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
