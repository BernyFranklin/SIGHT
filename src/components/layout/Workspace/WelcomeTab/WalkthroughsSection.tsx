import { Star } from 'lucide-react';

// COLOR: card bg = --color-surface, border = --color-border, star marker = --color-warning.
// SIZE: cards are ~96px tall placeholders; adjust h-24 once real content lands.
export function WalkthroughsSection() {
  return (
    <section>
      <h2
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Walkthroughs
      </h2>
      <div className="flex flex-col gap-3">
        <Card title="Getting Started" featured />
        <Card />
        <Card />
      </div>
    </section>
  );
}

function Card({ title, featured }: { title?: string; featured?: boolean }) {
  return (
    <div
      className="relative h-24 rounded-[var(--radius-md)] border p-3"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {title && (
        <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          {title}
        </div>
      )}
      {featured && (
        <div
          className="absolute right-2 top-2"
          style={{ color: 'var(--color-warning)' }}
          aria-label="Featured"
          role="img"
        >
          <Star size={16} fill="currentColor" />
        </div>
      )}
    </div>
  );
}
