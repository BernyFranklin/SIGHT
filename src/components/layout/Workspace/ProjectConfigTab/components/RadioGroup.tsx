import type { RadioOption } from '../types';

export function RadioGroup({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-text">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-primary"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
