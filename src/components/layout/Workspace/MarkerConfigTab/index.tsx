import type { Tab } from '@app/store/useWorkspaceStore';

import { ConfirmDialog } from './components/ConfirmDialog';
import { EventField } from './components/EventField';
import { Field } from './components/Field';
import { StatusBar } from './components/StatusBar';
import { NAME_MAX } from './constants';
import { useMarkerConfig } from './useMarkerConfig';

export function MarkerConfigTab({ tab }: { tab: Tab }) {
  const {
    markerSetName,
    events,
    status,
    errors,
    canSave,
    pendingRemove,
    setMarkerSetName,
    addEvent,
    updateEvent,
    requestRemove,
    confirmRemove,
    cancelRemove,
    handleSave,
    handleCancel,
  } = useMarkerConfig(tab.projectPath ?? '');

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
