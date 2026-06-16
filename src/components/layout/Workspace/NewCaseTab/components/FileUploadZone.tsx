import { FileText, Upload, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isCsv(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv');
}

export function FileUploadZone({
  file,
  onChange,
  error,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  /** Validation error from the form (e.g. required), shown when no local rejection. */
  error?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!isCsv(candidate)) {
      setRejected('Only .csv files are accepted.');
      return;
    }
    setRejected(null);
    onChange(candidate);
  };

  const message = rejected ?? error;

  if (file) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-bg px-3 py-2">
          <FileText size={16} className="shrink-0 text-text-muted" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-text">{file.name}</div>
            <div className="text-xs text-text-muted">
              {formatSize(file.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-sm border border-border bg-surface px-2 py-1 text-xs text-text transition-colors hover:bg-surface-raised"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => {
              setRejected(null);
              onChange(null);
            }}
            aria-label="Remove file"
            title="Remove file"
            className="rounded-sm p-1 text-text-muted transition-colors hover:text-text"
          >
            <X size={14} />
          </button>
        </div>
        {message && <span className="text-xs text-red-400">{message}</span>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed px-4 py-6 text-center transition-colors ${
          dragging
            ? 'border-primary bg-surface-raised'
            : 'border-border bg-bg hover:bg-surface'
        } ${message ? 'border-red-500' : ''}`}
      >
        <Upload size={18} className="text-text-muted" />
        <span className="text-sm text-text">
          Drag &amp; drop the gaze data CSV here, or{' '}
          <span className="text-primary">browse</span>
        </span>
        <span className="text-xs text-text-muted">.csv files only</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </label>
      {message && <span className="text-xs text-red-400">{message}</span>}
    </div>
  );
}
