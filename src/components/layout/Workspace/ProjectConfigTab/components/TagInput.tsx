import { useState, type KeyboardEvent } from 'react';

export function TagInput({
  values,
  onChange,
  placeholder,
  invalid,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      setDraft('');
      return;
    }
    onChange([...values, trimmed]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      e.preventDefault();
      onChange(values.slice(0, -1));
    }
  };

  const removeAt = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div
      className={`flex w-full flex-wrap items-center gap-1 rounded-sm border bg-bg px-1.5 py-1 text-sm focus-within:border-primary ${
        invalid ? 'border-red-500' : 'border-border'
      }`}
    >
      {values.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-1.5 py-0.5 text-xs text-text"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeAt(idx)}
            className="text-text-muted hover:text-text"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : ''}
        className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm text-text outline-none"
      />
    </div>
  );
}
