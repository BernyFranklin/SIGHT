import type { DropdownOption } from '../types';

export function Dropdown({
  value,
  options,
  onChange,
  invalid,
  placeholder,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (next: string) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-48 rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
        invalid ? 'border-red-500' : 'border-border'
      }`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
