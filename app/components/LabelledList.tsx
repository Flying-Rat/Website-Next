import type { CSSProperties } from 'react';

export function LabelledList({
  label,
  items,
  prominent = false,
  className = '',
  style,
}: {
  label: string;
  items: string[];
  prominent?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`flex flex-col gap-3 border-b border-line pb-6 md:flex-row md:items-baseline md:gap-10 md:pb-7 ${className}`}
      style={style}
    >
      <span className="eyebrow shrink-0">{label}</span>
      <ul
        className={`flex flex-wrap ${
          prominent
            ? 'font-display gap-x-7 gap-y-1 text-xl font-semibold text-ink md:gap-x-12 md:text-2xl'
            : 'gap-x-7 gap-y-1.5 text-sm font-medium text-secondary md:gap-x-10 md:text-base'
        }`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
