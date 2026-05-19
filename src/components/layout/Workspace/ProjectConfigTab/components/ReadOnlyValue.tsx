export function ReadOnlyValue({ value }: { value: string | null }) {
  const isEmpty = value == null || value === '';
  return (
    <div
      className={`inline-flex h-7 min-w-32 items-center rounded-sm border border-border bg-bg/40 px-2 text-sm ${
        isEmpty ? 'text-text-muted' : 'text-text'
      }`}
    >
      {isEmpty ? '—' : value}
    </div>
  );
}
