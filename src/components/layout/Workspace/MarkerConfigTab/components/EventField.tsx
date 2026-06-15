import { Info, MinusCircle } from 'lucide-react';

import { NAME_MAX, timestampHint } from '../constants';
import type { Event, EventError, Fps } from '../types';

import { TimestampInput } from './TimestampInput';

export function EventField({
  index,
  event,
  fps,
  error,
  onChange,
  onRemove,
}: {
  index: number;
  event: Event;
  fps: Fps;
  error?: EventError;
  onChange: (patch: Partial<Event>) => void;
  onRemove?: () => void;
}) {
  const hint = timestampHint(fps);
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
          <span title={hint} aria-label={hint} className="inline-flex cursor-help">
            <Info size={12} />
          </span>
        </legend>
        <TimestampInput
          label="Start Time"
          value={event.startTime}
          fps={fps}
          onChange={(v) => onChange({ startTime: v })}
          error={error?.startTime}
        />
        <TimestampInput
          label="End Time"
          value={event.endTime}
          fps={fps}
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
