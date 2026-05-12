export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-50 grid place-items-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="min-w-80 rounded-md border border-border bg-surface p-4 shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-text">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm bg-surface-raised px-3 py-1 text-sm text-text transition-colors hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="rounded-sm bg-red-700 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
