import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import type { QaReport } from '@app/api/cleaning';
import type { SaccadeReport } from '@app/api/saccade';
import { useProjectStore } from '@app/store/useProjectStore';
import type { Tab } from '@app/store/useWorkspaceStore';

import {
  type CaseField,
  deriveCaseFields,
  isCaseIncomplete,
} from '../NewCaseTab/schema';
import { FieldRow } from '../ProjectConfigTab/components/FieldRow';
import { Group } from '../ProjectConfigTab/components/Group';
import { ReadOnlyValue } from '../ProjectConfigTab/components/ReadOnlyValue';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toDisplay(value: string | number | null | undefined): string | null {
  if (value == null || (typeof value === 'string' && value.trim() === ''))
    return null;
  return String(value);
}

function BusyButton({
  label,
  busyLabel,
  busy,
  disabled = false,
  onClick,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="inline-flex h-8 w-fit items-center rounded-sm border border-border bg-bg/40 px-3 text-sm text-text transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? busyLabel : label}
    </button>
  );
}

function DataQualityPanel({
  report,
  busy,
  onClean,
}: {
  report: QaReport | null;
  busy: boolean;
  onClean: () => void;
}) {
  return (
    <Group title="Data Quality">
      {report == null ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-muted">
            This case&apos;s gaze data has not been cleaned yet.
          </span>
          <BusyButton
            label="Clean gaze data"
            busyLabel="Cleaning…"
            busy={busy}
            onClick={onClean}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <StatusBadge status={report.status} />
          <FieldRow label="Valid frames" units="%">
            <ReadOnlyValue
              value={(report.validity.gaze_valid_ratio * 100).toFixed(1)}
            />
          </FieldRow>
          <FieldRow label="Inferred sample rate" units="Hz">
            <ReadOnlyValue value={report.inferred_sample_rate_hz.toFixed(1)} />
          </FieldRow>
          <FieldRow label="Data gaps">
            <ReadOnlyValue
              value={`${report.invalid_runs.count} gaps / ${report.invalid_runs.total_frames} frames`}
            />
          </FieldRow>
          <FieldRow label="Excluded frames" units="%">
            <ReadOnlyValue value={report.excluded_pct.toFixed(1)} />
          </FieldRow>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Warnings</span>
            {report.warnings.length === 0 ? (
              <span className="text-sm text-text-muted">No warnings.</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {report.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-400">
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <BusyButton
            label="Re-clean"
            busyLabel="Cleaning…"
            busy={busy}
            onClick={onClean}
          />
        </div>
      )}
    </Group>
  );
}

function SaccadeAnalysisPanel({
  report,
  busy,
  cleaned,
  onRun,
}: {
  report: SaccadeReport | null;
  busy: boolean;
  cleaned: boolean;
  onRun: () => void;
}) {
  return (
    <Group title="Saccade Analysis">
      {!cleaned ? (
        <span className="text-sm text-text-muted">
          Clean this case&apos;s gaze data first to run saccade analysis.
        </span>
      ) : report == null ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-muted">
            Saccades have not been analyzed for this case yet.
          </span>
          <BusyButton
            label="Run saccade analysis"
            busyLabel="Analyzing…"
            busy={busy}
            onClick={onRun}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <StatusBadge status={report.status} />
          <FieldRow label="Saccades detected">
            <ReadOnlyValue value={String(report.saccade_count)} />
          </FieldRow>
          <FieldRow label="Analyzed frames">
            <ReadOnlyValue
              value={`${report.analyzed_frames} / ${report.total_frames}`}
            />
          </FieldRow>
          <FieldRow label="Sample rate" units="Hz">
            <ReadOnlyValue value={report.sampling_rate_hz.toFixed(1)} />
          </FieldRow>
          <FieldRow label="Mean amplitude" units="°">
            <ReadOnlyValue value={report.amplitude_deg.mean.toFixed(1)} />
          </FieldRow>
          <FieldRow label="Median amplitude" units="°">
            <ReadOnlyValue value={report.amplitude_deg.median.toFixed(1)} />
          </FieldRow>
          <FieldRow label="Peak velocity range" units="°/s">
            <ReadOnlyValue
              value={`${report.peak_velocity_deg_s.min.toFixed(0)} – ${report.peak_velocity_deg_s.max.toFixed(0)}`}
            />
          </FieldRow>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Warnings</span>
            {report.warnings.length === 0 ? (
              <span className="text-sm text-text-muted">No warnings.</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {report.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-400">
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <BusyButton
            label="Re-run"
            busyLabel="Analyzing…"
            busy={busy}
            onClick={onRun}
          />
        </div>
      )}
    </Group>
  );
}

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'ok' }) {
  const isWarn = status === 'warn';
  const classes = isWarn
    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
    : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
  return (
    <span
      className={`inline-flex w-fit items-center rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${classes}`}
    >
      {status}
    </span>
  );
}

export function CaseTab({ tab }: { tab: Tab }) {
  const projectPath = tab.projectPath ?? '';
  const record = useProjectStore((s) =>
    (s.cases[projectPath] ?? []).find((c) => c.id === tab.caseRecordId),
  );
  const config = useProjectStore((s) => s.projectConfigs[projectPath] ?? null);
  const caseRecordId = tab.caseRecordId ?? '';
  const report = useProjectStore(
    (s) => s.cleaningReports[projectPath]?.[caseRecordId] ?? null,
  );
  const busy = useProjectStore(
    (s) => s.cleaningBusy[projectPath]?.[caseRecordId] ?? false,
  );
  const runCleaning = useProjectStore((s) => s.runCleaning);
  const refreshCleaning = useProjectStore((s) => s.refreshCleaning);
  const saccadeReport = useProjectStore(
    (s) => s.saccadeReports[projectPath]?.[caseRecordId] ?? null,
  );
  const saccadeBusy = useProjectStore(
    (s) => s.saccadeBusy[projectPath]?.[caseRecordId] ?? false,
  );
  const runSaccade = useProjectStore((s) => s.runSaccade);
  const refreshSaccade = useProjectStore((s) => s.refreshSaccade);

  useEffect(() => {
    if (!projectPath || !caseRecordId) return;
    refreshCleaning(projectPath, caseRecordId);
    refreshSaccade(projectPath, caseRecordId);
  }, [projectPath, caseRecordId, refreshCleaning, refreshSaccade]);

  if (!record) {
    return (
      <div className="p-6 text-sm text-text-muted">
        This case is no longer available.
      </div>
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
          value === 'Other' && toDisplay(other)
            ? `Other — ${toDisplay(other)}`
            : toDisplay(value);
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
          typeof inatt === 'number' && typeof hyper === 'number'
            ? String(inatt + hyper)
            : null;
        return (
          <div
            key="asrs"
            className="flex flex-col gap-3 rounded-sm border border-border bg-bg/40 p-3"
          >
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
                This case is incomplete — the project schema requires fields
                that have no value.
              </span>
            </div>
          )}

          <Group title="Case">
            <FieldRow label="Case ID">
              <ReadOnlyValue value={record.caseId} />
            </FieldRow>
            <FieldRow label="Gaze Data File">
              <div className="flex flex-col text-sm">
                <span className="text-text">{record.fileName}</span>
                <span className="text-xs text-text-muted">
                  {formatSize(record.fileSize)}
                </span>
              </div>
            </FieldRow>
          </Group>

          {fields.length > 0 && (
            <Group title="Demographic & Clinical Metadata">
              {fields.map(renderField)}
            </Group>
          )}

          <DataQualityPanel
            report={report}
            busy={busy}
            onClean={() => runCleaning(projectPath, record.id)}
          />

          <SaccadeAnalysisPanel
            report={saccadeReport}
            busy={saccadeBusy}
            cleaned={report != null}
            onRun={() => runSaccade(projectPath, record.id)}
          />
        </div>
      </div>
    </div>
  );
}
