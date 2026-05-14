export function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
  invalid,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  invalid?: boolean;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      className={`w-32 rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
        invalid ? 'border-red-500' : 'border-border'
      }`}
    />
  );
}
