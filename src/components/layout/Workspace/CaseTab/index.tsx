import { AlertTriangle } from 'lucide-react';

import { useProjectStore } from '@app/store/useProjectStore';
import type { Tab } from '@app/store/useWorkspaceStore';

import { type CaseField, deriveCaseFields, isCaseIncomplete } from '../NewCaseTab/schema';
import { FieldRow } from '../ProjectConfigTab/components/FieldRow';
import { Group } from '../ProjectConfigTab/components/Group';
import { ReadOnlyValue } from '../ProjectConfigTab/components/ReadOnlyValue';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toDisplay(value: string | number | null | undefined): string | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return null;
  return String(value);
}

export function CaseTab({ tab }: { tab: Tab }) {
  const projectPath = tab.projectPath ?? '';
  const record = useProjectStore((s) =>
    (s.cases[projectPath] ?? []).find((c) => c.id === tab.caseRecordId),
  );
  const config = useProjectStore((s) => s.projectConfigs[projectPath] ?? null);

  if (!record) {
    return (
      <div className="p-6 text-sm text-text-muted">This case is no longer available.</div>
    );
  }

  const fields = deriveCaseFields(config);
  const incomplete = isCaseIncomplete(record, config);

  const renderField = (field: CaseField) => {
    switch (field.kind) {
      case 'age':
        return (
          <FieldRow key={field.key} label={field.label} units={field.units}>
            <ReadOnlyValue value={toDisplay(record.demographics[field.key])} />
          </FieldRow>
        );
      case 'gender': {
        const value = record.demographics[field.key];
        const other = record.demographics[field.otherKey];
        const display =
          value === 'Other' && toDisplay(other) ? `Other — ${toDisplay(other)}` : toDisplay(value);
        return (
          <FieldRow key={field.key} label={field.label}>
            <ReadOnlyValue value={display} />
          </FieldRow>
        );
      }
      case 'asrs': {
        const inatt = record.demographics[field.inattentionKey];
        const hyper = record.demographics[field.hyperactivityKey];
        const total =
          typeof inatt === 'number' && typeof hyper === 'number' ? String(inatt + hyper) : null;
        return (
          <div key="asrs" className="flex flex-col gap-3 rounded-sm border border-border bg-bg/40 p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {field.label}
            </span>
            <FieldRow label="Inattention" units="score">
              <ReadOnlyValue value={toDisplay(inatt)} />
            </FieldRow>
            <FieldRow label="Hyperactivity/Impulsivity" units="score">
              <ReadOnlyValue value={toDisplay(hyper)} />
            </FieldRow>
            <FieldRow label="Total" units="score">
              <ReadOnlyValue value={total} />
            </FieldRow>
          </div>
        );
      }
      case 'custom-number':
      case 'custom-text':
      case 'custom-dropdown':
        return (
          <FieldRow key={field.key} label={field.label}>
            <ReadOnlyValue value={toDisplay(record.demographics[field.key])} />
          </FieldRow>
        );
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="flex max-w-2xl flex-col gap-6">
          {incomplete && (
            <div className="flex items-center gap-2 rounded-sm border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                This case is incomplete — the project schema requires fields that have no value.
              </span>
            </div>
          )}

          <Group title="Case">
            <FieldRow label="Case ID">
              <ReadOnlyValue value={record.caseId} />
            </FieldRow>
            <FieldRow label="Gaze Data File">
              <div className="flex flex-col text-sm">
                <span className="text-text">{record.file.name}</span>
                <span className="text-xs text-text-muted">{formatSize(record.file.size)}</span>
              </div>
            </FieldRow>
          </Group>

          {fields.length > 0 && (
            <Group title="Demographic & Clinical Metadata">{fields.map(renderField)}</Group>
          )}
        </div>
      </div>
    </div>
  );
}
