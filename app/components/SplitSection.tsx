import type { ReactNode } from 'react';

export function SplitSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="grid scroll-mt-24 gap-6 border-t border-line py-12 md:py-16 lg:grid-cols-12 lg:gap-8"
    >
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">{title}</h2>
          {description && <p className="mt-3 max-w-sm text-pretty text-muted">{description}</p>}
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  );
}
