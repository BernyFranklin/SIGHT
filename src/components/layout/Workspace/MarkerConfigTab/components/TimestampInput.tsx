import { formatTimestamp } from '../timestamp';
import type { Fps } from '../types';

export function TimestampInput({
  label,
  value,
  fps,
  onChange,
  error,
}: {
  label: string;
  value: string;
  fps: Fps;
  onChange: (value: string) => void;
  error?: string;
}) {
  const borderClass = error ? 'border-red-500' : 'border-border';
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="HH:MM:SS:FF"
        value={value}
        onChange={(e) => onChange(formatTimestamp(e.target.value, fps))}
        className={`w-full rounded-sm border bg-bg px-2 py-1 font-mono text-sm text-text outline-none focus:border-primary ${borderClass}`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}
