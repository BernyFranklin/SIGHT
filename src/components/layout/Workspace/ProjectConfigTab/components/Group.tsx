export function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-sm border border-border bg-surface p-3">
      <span className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </span>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
