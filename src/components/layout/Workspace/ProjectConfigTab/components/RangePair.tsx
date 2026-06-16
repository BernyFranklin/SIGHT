import { NumberInput } from './NumberInput';

export function RangePair({
  minValue,
  maxValue,
  minBounds,
  maxBounds,
  step,
  onMinChange,
  onMaxChange,
  invalid,
}: {
  minValue: number;
  maxValue: number;
  minBounds: { min: number; max: number };
  maxBounds: { min: number; max: number };
  step: number;
  onMinChange: (next: number) => void;
  onMaxChange: (next: number) => void;
  invalid?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <NumberInput
        value={minValue}
        min={minBounds.min}
        max={minBounds.max}
        step={step}
        onChange={(n) => {
          if (n != null) onMinChange(n);
        }}
        invalid={invalid}
      />
      <span className="text-xs uppercase tracking-wider text-text-muted">
        to
      </span>
      <NumberInput
        value={maxValue}
        min={maxBounds.min}
        max={maxBounds.max}
        step={step}
        onChange={(n) => {
          if (n != null) onMaxChange(n);
        }}
        invalid={invalid}
      />
    </div>
  );
}
