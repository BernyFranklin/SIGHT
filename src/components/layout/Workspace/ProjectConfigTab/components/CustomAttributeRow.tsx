import { useState } from 'react';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

import type { CustomAttribute, CustomAttributeType } from '../types';

import { RadioGroup } from './RadioGroup';
import { TagInput } from './TagInput';

const TYPE_OPTIONS = [
  { value: 'number', label: 'Number' },
  { value: 'text', label: 'Text' },
  { value: 'dropdown', label: 'Dropdown' },
];

export function CustomAttributeRow({
  attribute,
  errors,
  onChange,
  onDelete,
}: {
  attribute: CustomAttribute;
  errors?: { label?: string; options?: string };
  onChange: (patch: Partial<CustomAttribute>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attribute.id,
  });
  const [confirming, setConfirming] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  if (confirming) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex flex-col gap-2 rounded-sm border border-red-500/60 bg-bg p-2"
      >
        <p className="text-xs text-text">
          Delete <span className="font-semibold">{attribute.label || 'this attribute'}</span>?
          Existing participant data for this field will be permanently removed.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-sm border border-border bg-surface px-2 py-1 text-xs text-text hover:border-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
            className="rounded-sm border border-red-500 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 rounded-sm border border-border bg-bg p-2"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="mt-1 cursor-grab text-text-muted hover:text-text active:cursor-grabbing"
        >
          ⋮⋮
        </button>
        <div className="flex flex-1 flex-col gap-2">
          <input
            type="text"
            value={attribute.label}
            maxLength={50}
            placeholder="Attribute label"
            onChange={(e) => onChange({ label: e.target.value })}
            className={`w-full rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
              errors?.label ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors?.label && <span className="text-xs text-red-500">{errors.label}</span>}
          <RadioGroup
            name={`custom-attr-type-${attribute.id}`}
            value={attribute.type}
            options={TYPE_OPTIONS}
            onChange={(s) => onChange({ type: s as CustomAttributeType })}
          />
          {attribute.type === 'dropdown' && (
            <div className="flex flex-col gap-1">
              <TagInput
                values={attribute.options}
                onChange={(next) => onChange({ options: next })}
                placeholder="Add option and press Enter..."
                invalid={Boolean(errors?.options)}
              />
              {errors?.options && (
                <span className="text-xs text-red-500">{errors.options}</span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="Delete attribute"
          className="mt-1 text-text-muted hover:text-red-500"
        >
          ×
        </button>
      </div>
    </div>
  );
}
