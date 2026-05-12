import { Info, MinusCircle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

type Event = { id: string; name: string; startTime: string; endTime: string };

type Status = 'new' | 'dirty' | 'clean';

const NAME_MAX = 20;
const FPS = 30;
const TIMESTAMP_HINT = `Format HH:MM:SS:FF (FF = frame, 0–${FPS - 1} at ${FPS} fps). Digits auto-format as you type.`;

const blankEvent = (id: string): Event => ({ id, name: '', startTime: '', endTime: '' });

function formatTimestamp(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const pairs: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    pairs.push(digits.slice(i, i + 2));
  }
  const caps = [99, 59, 59, FPS - 1];
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i].length === 2) {
      const n = Math.min(parseInt(pairs[i], 10), caps[i]);
      pairs[i] = n.toString().padStart(2, '0');
    }
  }
  return pairs.join(':');
}

const eventsEqual = (a: Event[], b: Event[]) =>
  a.length === b.length
  && a.every((e, i) =>
    e.name === b[i].name
    && e.startTime === b[i].startTime
    && e.endTime === b[i].endTime);

function tsToFrames(ts: string): number | null {
  const parts = ts.split(':');
  if (parts.length !== 4 || parts.some((p) => p.length !== 2)) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => Number.isNaN(n))) return null;
  const [h, m, s, f] = nums;
  return ((h * 60 + m) * 60 + s) * FPS + f;
}

type EventError = { startTime?: string; endTime?: string; overlap?: string };

function validateEvents(events: Event[]): Record<string, EventError> {
  const errors: Record<string, EventError> = {};
  const ranges: { id: string; start: number; end: number }[] = [];

  for (const e of events) {
    const err: EventError = {};
    const start = tsToFrames(e.startTime);
    const end = tsToFrames(e.endTime);
    if (e.startTime !== '' && start === null) err.startTime = 'Incomplete timestamp.';
    if (e.endTime !== '' && end === null) err.endTime = 'Incomplete timestamp.';
    if (start !== null && end !== null) {
      if (end <= start) err.endTime = 'End time must be after start time.';
      else ranges.push({ id: e.id, start, end });
    }
    if (Object.keys(err).length) errors[e.id] = err;
  }

  ranges.sort((a, b) => a.start - b.start);
  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i].start < ranges[i - 1].end) {
      const id = ranges[i].id;
      errors[id] = { ...(errors[id] ?? {}), overlap: 'Overlaps another event.' };
    }
  }

  return errors;
}

function sortByStart(events: Event[]): Event[] {
  return [...events].sort(
    (a, b) => (tsToFrames(a.startTime) ?? 0) - (tsToFrames(b.startTime) ?? 0),
  );
}

export function MarkerConfigTab() {
  const idCounter = useRef(0);
  const nextId = () => {
    idCounter.current += 1;
    return `e${idCounter.current}`;
  };
  const [markerSetName, setMarkerSetName] = useState('');
  const [events, setEvents] = useState<Event[]>(() => [blankEvent(`e${++idCounter.current}`)]);
  const [saved, setSaved] = useState<{ markerSetName: string; events: Event[] } | null>(null);
  const [touched, setTouched] = useState(false);

  const status: Status = useMemo(() => {
    if (!saved) return touched ? 'dirty' : 'new';
    if (saved.markerSetName === markerSetName && eventsEqual(saved.events, events)) return 'clean';
    return 'dirty';
  }, [saved, touched, markerSetName, events]);

  const errors = useMemo(() => validateEvents(events), [events]);
  const hasErrors = Object.keys(errors).length > 0;
  const allEventsComplete = events.every(
    (e) => tsToFrames(e.startTime) !== null && tsToFrames(e.endTime) !== null,
  );

  const canSave = status === 'dirty' && !hasErrors && allEventsComplete;

  const handleSave = () => {
    if (!canSave) return;
    const sorted = sortByStart(events);
    setEvents(sorted);
    setSaved({
      markerSetName,
      events: sorted.map((e) => ({ ...e })),
    });
    setTouched(false);
  };

  const handleCancel = () => {
    if (saved) {
      setMarkerSetName(saved.markerSetName);
      setEvents(saved.events.map((e) => ({ ...e })));
    } else {
      setMarkerSetName('');
      setEvents([blankEvent(nextId())]);
    }
    setTouched(false);
  };

  const markTouched = () => setTouched(true);

  const handleNameChange = (value: string) => {
    setMarkerSetName(value);
    markTouched();
  };

  const addEvent = () => {
    setEvents((prev) => [...prev, blankEvent(nextId())]);
    markTouched();
  };

  const updateEvent = (id: string, patch: Partial<Event>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    markTouched();
  };

  const [pendingRemove, setPendingRemove] = useState<{ id: string; index: number } | null>(null);

  const requestRemove = (id: string) => {
    const idx = events.findIndex((e) => e.id === id);
    if (idx < 0) return;
    setPendingRemove({ id, index: idx + 1 });
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    const { id } = pendingRemove;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setPendingRemove(null);
    markTouched();
  };

  const cancelRemove = () => setPendingRemove(null);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <StatusBar status={status} canSave={canSave} onSave={handleSave} onCancel={handleCancel} />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex max-w-2xl flex-col gap-6">
          <Field label="Marker Set Name">
            <input
              type="text"
              value={markerSetName}
              maxLength={NAME_MAX}
              onChange={(e) => handleNameChange(e.target.value.slice(0, NAME_MAX))}
              className="w-full rounded-sm border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary"
            />
          </Field>

          {events.map((event, idx) => (
            <EventField
              key={event.id}
              index={idx + 1}
              event={event}
              error={errors[event.id]}
              onChange={(patch) => updateEvent(event.id, patch)}
              onRemove={idx > 0 ? () => requestRemove(event.id) : undefined}
            />
          ))}

          <div>
            <button
              type="button"
              onClick={addEvent}
              className="rounded-sm border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
      {pendingRemove && (
        <ConfirmDialog
          message={`Remove Event ${pendingRemove.index}? This cannot be undone.`}
          onConfirm={confirmRemove}
          onCancel={cancelRemove}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
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

function StatusBar({
  status,
  canSave,
  onSave,
  onCancel,
}: {
  status: Status;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { bg, text, message } = statusStyles(status);
  return (
    <div className={`flex shrink-0 items-center gap-3 border-b border-border px-4 py-2 ${bg}`}>
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

function statusStyles(status: Status): { bg: string; text: string; message: string } {
  switch (status) {
    case 'new':
      return {
        bg: 'bg-neutral-700',
        text: 'text-white',
        message: 'Please enter marker data for this project...',
      };
    case 'dirty':
      return {
        bg: 'bg-red-700',
        text: 'text-white',
        message: 'The marker config has unsaved changes, please save before closing.',
      };
    case 'clean':
      return {
        bg: 'bg-green-700',
        text: 'text-white',
        message: 'Marker config saved successfully.',
      };
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function TimestampInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const borderClass = error ? 'border-red-500' : 'border-border';
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="HH:MM:SS:FF"
        value={value}
        onChange={(e) => onChange(formatTimestamp(e.target.value))}
        className={`w-full rounded-sm border bg-bg px-2 py-1 font-mono text-sm text-text outline-none focus:border-primary ${borderClass}`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}

function EventField({
  index,
  event,
  error,
  onChange,
  onRemove,
}: {
  index: number;
  event: Event;
  error?: EventError;
  onChange: (patch: Partial<Event>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
          {`Event ${index}`}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove Event ${index}`}
            title={`Remove Event ${index}`}
            className="rounded-sm p-0.5 text-text-muted transition-colors hover:text-red-500"
          >
            <MinusCircle size={16} />
          </button>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-text-muted">Name</span>
        <input
          type="text"
          value={event.name}
          maxLength={NAME_MAX}
          onChange={(e) => onChange({ name: e.target.value.slice(0, NAME_MAX) })}
          className="w-full rounded-sm border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary"
        />
      </label>
      <fieldset className="flex flex-col gap-2 rounded-sm border border-border bg-surface p-3">
        <legend className="flex items-center gap-1 px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Timestamp
          <span title={TIMESTAMP_HINT} aria-label={TIMESTAMP_HINT} className="inline-flex cursor-help">
            <Info size={12} />
          </span>
        </legend>
        <TimestampInput
          label="Start Time"
          value={event.startTime}
          onChange={(v) => onChange({ startTime: v })}
          error={error?.startTime}
        />
        <TimestampInput
          label="End Time"
          value={event.endTime}
          onChange={(v) => onChange({ endTime: v })}
          error={error?.endTime}
        />
        {error?.overlap && (
          <span className="px-1 text-xs text-red-500">{error.overlap}</span>
        )}
      </fieldset>
    </div>
  );
}
