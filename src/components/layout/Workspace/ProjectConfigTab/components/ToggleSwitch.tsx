export function ToggleSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs uppercase tracking-wider ${value ? 'text-text-muted/60' : 'text-text'}`}
      >
        Off
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
          value ? 'bg-primary' : 'bg-surface-raisedc'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span
        className={`text-xs uppercase tracking-wider ${value ? 'text-text' : 'text-text-muted/60'}`}
      >
        On
      </span>
    </div>
  );
}
