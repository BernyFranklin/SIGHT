import { Info } from 'lucide-react';

export function FieldRow({
  label,
  units,
  dimmed,
  message,
  children,
}: {
  label: string;
  units?: string;
  dimmed?: boolean;
  message?: { text: string; tone: 'error' | 'warning' };
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${dimmed ? 'pointer-events-none opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <span>{label}</span>
        <Info size={12} className="text-text-muted/70" aria-hidden />
        {units && <span className="ml-1 normal-case tracking-normal text-text-muted/80">({units})</span>}
      </div>
      {children}
      {message && (
        <span
          className={`text-xs ${message.tone === 'error' ? 'text-red-400' : 'text-amber-400'}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
