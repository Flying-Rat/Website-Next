import { FadeInView } from './FadeInView';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <FadeInView className="mb-10 grid gap-4 md:mb-16 md:grid-cols-12 md:items-end md:gap-8">
      <h2 className="section-title md:col-span-7">{title}</h2>
      {subtitle && (
        <div className="section-subtitle max-w-md md:col-span-5 md:justify-self-end">
          {subtitle}
        </div>
      )}
    </FadeInView>
  );
}
