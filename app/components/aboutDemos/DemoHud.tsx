import type { ReactNode } from 'react';

/**
 * The plates every demo shows under its play area: what to do, its numbers, and
 * a way to start over. What they say is the demo's; how they look is shared, so
 * switching demos never changes the furniture.
 */

const PLATE =
  'glass eyebrow flex h-9 items-center rounded-full border border-line px-4 text-secondary';

/** The row itself. Place it with `className`; it is centred and wraps. */
export function DemoHud({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`pointer-events-none flex flex-wrap items-center justify-center gap-2 ${className}`}
    >
      {children}
    </div>
  );
}

/** A line of text, such as the hint; `strong` while it reports how a round ended. */
export function DemoNote({
  id,
  strong = false,
  children,
}: {
  id?: string;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <p id={id} className={`${PLATE} ${strong ? 'text-ink' : ''}`}>
      {children}
    </p>
  );
}

export function DemoStat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <p className={PLATE}>
      {label}
      <b className="ml-2 font-semibold text-ink tabular-nums">{value}</b>
    </p>
  );
}

export function DemoAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${PLATE} pointer-events-auto cursor-pointer transition-colors hover:text-ink`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** A plate on its own, for anything else a demo shows in the same style. */
export function DemoPlate({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${PLATE} ${className}`}>{children}</div>;
}
