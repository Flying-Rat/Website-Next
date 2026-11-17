'use client';

import { useTranslation } from '../i18n';
import { pad2 } from '../utils/pad2';
import { FadeInView } from './FadeInView';
import {
  AiIcon,
  ArtIcon,
  BackendIcon,
  DesignIcon,
  EngineeringIcon,
  FullGameIcon,
  PortingIcon,
  QaIcon,
} from './icons';
import { SectionHeader } from './SectionHeader';

const whatWeDoItems = [
  { key: 'engineering', Icon: EngineeringIcon },
  { key: 'porting', Icon: PortingIcon },
  { key: 'art', Icon: ArtIcon },
  { key: 'design', Icon: DesignIcon },
  { key: 'qa', Icon: QaIcon },
  { key: 'backend', Icon: BackendIcon },
  { key: 'ai', Icon: AiIcon },
  { key: 'fullGames', Icon: FullGameIcon },
];

export function WhatWeDo() {
  const { t } = useTranslation();

  return (
    <section id="what-we-do" className="section-pad relative">
      <div className="container">
        <SectionHeader title={t('whatWeDo.title')} subtitle={t('whatWeDo.subtitle')} />

        <FadeInView margin="-60px">
          {/* 1px gaps over a border-coloured backdrop draw the hairlines between cells. */}
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
            {whatWeDoItems.map(({ key, Icon }, index) => (
              <li
                key={key}
                // Phones: icon, title and index share one row (the wrapper below is
                // `contents`, so its children join this grid). From sm up the icon and
                // index sit on their own row above the title.
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 bg-page p-5 transition-colors duration-300 hover:bg-surface sm:flex sm:flex-col sm:items-stretch sm:p-6 md:p-8 xl:p-7"
              >
                <div className="contents sm:mb-6 sm:flex sm:items-start sm:justify-between md:mb-8">
                  <Icon className="size-6 [stroke-width:1.75] text-ink transition-colors duration-300 group-hover:text-accent-ink sm:size-8 sm:[stroke-width:1.5] md:size-9" />
                  <span className="order-3 font-mono text-xs text-subtle transition-colors duration-300 group-hover:text-accent-ink sm:order-none">
                    {pad2(index + 1)}
                  </span>
                </div>
                <h3 className="font-display order-2 text-xl font-semibold sm:order-none md:text-2xl">
                  {t(`whatWeDo.${key}.title`)}
                </h3>
                <p className="order-4 col-span-full mt-3 text-md leading-relaxed text-pretty text-muted sm:order-none sm:text-sm md:text-md">
                  {t(`whatWeDo.${key}.body`)}
                </p>
              </li>
            ))}
          </ul>
        </FadeInView>
      </div>
    </section>
  );
}
