import type { Status } from '../types';

export type StatusMessages = { new: string; dirty: string; clean: string };

const DEFAULT_MESSAGES: StatusMessages = {
  new: 'Please enter marker data for this project...',
  dirty: 'The marker config has unsaved changes, please save before closing.',
  clean: 'Marker config saved successfully.',
};

export function StatusBar({
  status,
  canSave,
  onSave,
  onCancel,
  messages = DEFAULT_MESSAGES,
}: {
  status: Status;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
  messages?: StatusMessages;
}) {
  const { bg, text } = statusStyles(status);
  const message = messages[status];
  return (
    <div
      className={`flex shrink-0 items-center gap-3 border-b border-border px-4 py-2 ${bg}`}
    >
      <span className={`flex-1 text-sm ${text}`}>{message}</span>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className="rounded-sm bg-surface px-3 py-1 text-sm text-text transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-sm bg-surface px-3 py-1 text-sm text-text transition-colors hover:bg-surface-raised"
      >
        Cancel
      </button>
    </div>
  );
}

function statusStyles(status: Status): { bg: string; text: string } {
  switch (status) {
    case 'new':
      return { bg: 'bg-neutral-700', text: 'text-white' };
    case 'dirty':
      return { bg: 'bg-red-900/60', text: 'text-white' };
    case 'clean':
      return { bg: 'bg-green-900/60', text: 'text-white' };
  }
}
