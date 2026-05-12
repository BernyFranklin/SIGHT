import { Star } from 'lucide-react';

// SIZE: cards are ~96px tall placeholders; adjust h-24 once real content lands.
export function WalkthroughsSection() {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
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
    <div className="relative h-24 rounded-md border border-border bg-surface p-3">
      {title && <div className="text-sm font-medium text-text">{title}</div>}
      {featured && (
        <div
          className="absolute right-2 top-2 text-warning"
          aria-label="Featured"
          role="img"
        >
          <Star size={16} fill="currentColor" />
        </div>
      )}
    </div>
  );
}
