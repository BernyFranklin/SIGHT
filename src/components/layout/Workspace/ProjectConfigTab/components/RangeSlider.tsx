export function RangeSlider({
  value,
  min,
  max,
  step,
  decimals = 0,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (next: number) => void;
}) {
  const display = Number.isFinite(value) ? value.toFixed(decimals) : '';
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-surface-raised accent-primary"
      />
      <span className="w-16 shrink-0 text-right font-mono text-sm tabular-nums text-text">{display}</span>
    </div>
  );
}
