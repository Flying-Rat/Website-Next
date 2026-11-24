'use client';

import { CrossIcon } from '../components/icons';
import { useTranslation } from '../i18n';

interface PastPosition {
  key: string;
  level: string;
  anchorId: string;
}

export function PastPositions({ positions }: { positions: PastPosition[] }) {
  const { t } = useTranslation();

  return (
    <ul className="border-b border-line">
      {positions.map((position) => {
        const points = t(`jobs.positions.${position.key}.points`, {
          returnObjects: true,
        }) as string[];

        return (
          <li key={position.key} className="border-t border-line">
            <details id={position.anchorId} className="past-role group/role scroll-mt-28">
              <summary className="group/summary flex cursor-pointer list-none items-center gap-4 py-5 sm:gap-6 sm:py-6 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="font-display text-xl font-semibold text-balance text-muted line-through decoration-subtle decoration-1 transition-colors duration-300 group-open/role:text-ink group-open/role:no-underline group-hover/summary:text-ink sm:text-2xl">
                    {t(`jobs.positions.${position.key}.title`)}
                  </span>
                </span>
                <span className="eyebrow shrink-0">
                  <span className="hidden sm:inline">
                    {t(`jobs.levels.${position.level}`)}
                    <span aria-hidden="true" className="mx-2.5">
                      /
                    </span>
                  </span>
                  {t('jobs.closed')}
                </span>
                <CrossIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 rotate-45 text-subtle transition-[rotate,color] duration-300 ease-smooth group-open/role:rotate-0 group-open/role:text-ink group-hover/summary:text-ink"
                />
              </summary>

              <div className="pb-7 sm:pb-9">
                <p className="max-w-3xl text-md leading-relaxed text-pretty text-secondary sm:text-[17px]">
                  {t(`jobs.positions.${position.key}.description`)}
                </p>
                <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="border-t border-line py-2.5 text-sm text-muted sm:py-3 sm:text-md"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
