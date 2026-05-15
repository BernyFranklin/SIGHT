export function TextArea({
  value,
  onChange,
  maxLength,
  rows = 4,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  invalid?: boolean;
}) {
  const atLimit = value.length >= maxLength;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        className={`w-full resize-y rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
          invalid ? 'border-red-500' : 'border-border'
        }`}
      />
      <span
        className={`self-end text-xs ${atLimit ? 'text-amber-400' : 'text-text-muted/70'}`}
      >
        {value.length} / {maxLength}
      </span>
    </div>
  );
}
