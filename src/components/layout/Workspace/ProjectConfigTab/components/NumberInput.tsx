export function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
  invalid,
  nullable,
}: {
  value: number | null;
  min: number;
  max: number;
  step: number;
  onChange: (next: number | null) => void;
  invalid?: boolean;
  nullable?: boolean;
}) {
  return (
    <input
      type="number"
      value={value != null && Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          if (nullable) onChange(null);
          return;
        }
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
      className={`w-32 rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
        invalid ? 'border-red-500' : 'border-border'
      }`}
    />
  );
}
