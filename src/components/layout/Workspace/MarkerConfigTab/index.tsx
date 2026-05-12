import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';

type Event = { id: number; name: string; startTime: string; endTime: string };

type Status = 'new' | 'dirty' | 'clean';

const NAME_MAX = 20;
const FPS = 30;
const TIMESTAMP_HINT = `Format HH:MM:SS:FF (FF = frame, 0–${FPS - 1} at ${FPS} fps). Digits auto-format as you type.`;

const blankEvent = (id: number): Event => ({ id, name: '', startTime: '', endTime: '' });

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

export function MarkerConfigTab() {
  const [markerSetName, setMarkerSetName] = useState('');
  const [events, setEvents] = useState<Event[]>([blankEvent(1)]);
  const [saved, setSaved] = useState<{ markerSetName: string; events: Event[] } | null>(null);
  const [touched, setTouched] = useState(false);

  const status: Status = useMemo(() => {
    if (!saved) return touched ? 'dirty' : 'new';
    if (saved.markerSetName === markerSetName && eventsEqual(saved.events, events)) return 'clean';
    return 'dirty';
  }, [saved, touched, markerSetName, events]);

  const canSave = status === 'dirty';

  const handleSave = () => {
    if (!canSave) return;
    setSaved({
      markerSetName,
      events: events.map((e) => ({ ...e })),
    });
    setTouched(false);
  };

  const handleCancel = () => {
    if (saved) {
      setMarkerSetName(saved.markerSetName);
      setEvents(saved.events.map((e) => ({ ...e })));
    } else {
      setMarkerSetName('');
      setEvents([blankEvent(1)]);
    }
    setTouched(false);
  };

  const markTouched = () => setTouched(true);

  const handleNameChange = (value: string) => {
    setMarkerSetName(value);
    markTouched();
  };

  const addEvent = () => {
    setEvents((prev) => [...prev, blankEvent((prev[prev.length - 1]?.id ?? 0) + 1)]);
    markTouched();
  };

  const updateEvent = (id: number, patch: Partial<Event>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    markTouched();
  };

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
              className="w-full rounded-sm border border-border bg-surface px-2 py-1 text-sm text-text outline-none focus:border-primary"
            />
          </Field>

          {events.map((event) => (
            <EventField
              key={event.id}
              event={event}
              onChange={(patch) => updateEvent(event.id, patch)}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="HH:MM:SS:FF"
        value={value}
        onChange={(e) => onChange(formatTimestamp(e.target.value))}
        className="w-full rounded-sm border border-border bg-surface px-2 py-1 font-mono text-sm text-text outline-none focus:border-primary"
      />
    </label>
  );
}

function EventField({ event, onChange }: { event: Event; onChange: (patch: Partial<Event>) => void }) {
  return (
    <fieldset className="flex flex-col gap-2 rounded-sm border border-border bg-surface p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {`Event ${event.id}`}
      </legend>
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
      <fieldset className="flex flex-col gap-2 rounded-sm border border-border bg-bg p-3">
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
        />
        <TimestampInput
          label="End Time"
          value={event.endTime}
          onChange={(v) => onChange({ endTime: v })}
        />
      </fieldset>
    </fieldset>
  );
}
