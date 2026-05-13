import { Info } from 'lucide-react';

import type { Tab } from '@app/store/useWorkspaceStore';

import { ConfirmDialog } from './components/ConfirmDialog';
import { EventField } from './components/EventField';
import { Field } from './components/Field';
import { StatusBar } from './components/StatusBar';
import { FPS_OPTIONS, NAME_MAX, timestampHint } from './constants';
import type { Fps } from './types';
import { useMarkerConfig } from './useMarkerConfig';

const FPS_LOCK_HINT = 'Frame rate is locked once any event timestamp has been entered. Clear timestamps to change it.';

export function MarkerConfigTab({ tab }: { tab: Tab }) {
  const {
    markerSetName,
    fps,
    fpsLocked,
    events,
    status,
    errors,
    canSave,
    pendingRemove,
    setMarkerSetName,
    setFps,
    addEvent,
    updateEvent,
    requestRemove,
    confirmRemove,
    cancelRemove,
    handleSave,
    handleCancel,
  } = useMarkerConfig(tab.projectPath ?? '');

  const fpsHint = timestampHint(fps);

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
              onChange={(e) => setMarkerSetName(e.target.value.slice(0, NAME_MAX))}
              className="w-full rounded-sm border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary"
            />
          </Field>

          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Frames Per Second
              <span
                title={fpsLocked ? FPS_LOCK_HINT : fpsHint}
                aria-label={fpsLocked ? FPS_LOCK_HINT : fpsHint}
                className="inline-flex cursor-help"
              >
                <Info size={12} />
              </span>
            </span>
            <select
              value={fps}
              disabled={fpsLocked}
              onChange={(e) => setFps(Number(e.target.value) as Fps)}
              className="w-32 rounded-sm border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {FPS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          {events.map((event, idx) => (
            <EventField
              key={event.id}
              index={idx + 1}
              event={event}
              fps={fps}
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
