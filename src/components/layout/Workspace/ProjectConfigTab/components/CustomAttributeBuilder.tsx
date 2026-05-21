import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { MAX_CUSTOM_ATTRIBUTES } from '../constants';
import type { CustomAttribute } from '../types';

import { CustomAttributeRow } from './CustomAttributeRow';

export type CustomAttributeErrors = Record<string, { label?: string; options?: string }>;

export function CustomAttributeBuilder({
  attributes,
  errors,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: {
  attributes: CustomAttribute[];
  errors: CustomAttributeErrors;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<CustomAttribute>) => void;
  onDelete: (id: string) => void;
  onReorder: (next: CustomAttribute[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = attributes.findIndex((a) => a.id === active.id);
    const newIndex = attributes.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(attributes, oldIndex, newIndex));
  };

  const atLimit = attributes.length >= MAX_CUSTOM_ATTRIBUTES;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Custom Attributes
        </span>
        <span className="text-xs text-text-muted">
          {attributes.length} / {MAX_CUSTOM_ATTRIBUTES}
        </span>
      </div>
      {attributes.length === 0 ? (
        <p className="text-xs italic text-text-muted">No custom attributes yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={attributes.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {attributes.map((attr) => (
                <CustomAttributeRow
                  key={attr.id}
                  attribute={attr}
                  errors={errors[attr.id]}
                  onChange={(patch) => onUpdate(attr.id, patch)}
                  onDelete={() => onDelete(attr.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={atLimit}
        className="self-start rounded-sm border border-border bg-surface px-2 py-1 text-xs text-text hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add attribute
      </button>
    </div>
  );
}
