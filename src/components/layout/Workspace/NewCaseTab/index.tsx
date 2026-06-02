import { useEffect } from 'react';

import type { Tab } from '@app/store/useWorkspaceStore';

import { Dropdown } from '../ProjectConfigTab/components/Dropdown';
import { FieldRow } from '../ProjectConfigTab/components/FieldRow';
import { Group } from '../ProjectConfigTab/components/Group';
import { NumberInput } from '../ProjectConfigTab/components/NumberInput';
import { ReadOnlyValue } from '../ProjectConfigTab/components/ReadOnlyValue';

import { FileUploadZone } from './components/FileUploadZone';
import type { CaseField } from './schema';
import { useNewCase } from './useNewCase';
import { CASE_ID_MAX, CUSTOM_TEXT_MAX } from './validation';

export function NewCaseTab({ tab }: { tab: Tab }) {
  const projectPath = tab.projectPath ?? '';
  const {
    fields,
    caseId,
    setCaseId,
    file,
    setFile,
    demographics,
    setDemographic,
    caseIdError,
    fileError,
    fieldErrors,
    showError,
    markTouched,
    canSubmit,
    saving,
    handleSubmit,
    handleCancel,
  } = useNewCase(projectPath, tab.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleCancel]);

  const renderField = (field: CaseField) => {
    switch (field.kind) {
      case 'age':
        return (
          <FieldRow
            key={field.key}
            label={field.label}
            units={field.units}
            message={errorMessage(showError(field.key) ? fieldErrors[field.key] : undefined)}
          >
            <NumberInput
              value={asNumber(demographics[field.key])}
              min={5}
              max={120}
              step={1}
              nullable
              invalid={showError(field.key) && Boolean(fieldErrors[field.key])}
              onChange={(n) => setDemographic(field.key, n)}
            />
          </FieldRow>
        );
      case 'gender': {
        const value = (demographics[field.key] as string) ?? '';
        const showOther = value === 'Other';
        const genderErr = showError(field.key) ? fieldErrors[field.key] : undefined;
        const otherErr = showError(field.otherKey) ? fieldErrors[field.otherKey] : undefined;
        return (
          <FieldRow key={field.key} label={field.label} message={errorMessage(genderErr ?? otherErr)}>
            <div className="flex flex-wrap items-center gap-2">
              <Dropdown
                value={value}
                options={field.options}
                placeholder="Select..."
                invalid={Boolean(genderErr)}
                onChange={(s) => {
                  setDemographic(field.key, s);
                  markTouched(field.key);
                }}
              />
              {showOther && (
                <input
                  type="text"
                  value={(demographics[field.otherKey] as string) ?? ''}
                  maxLength={50}
                  placeholder="Please specify"
                  onBlur={() => markTouched(field.otherKey)}
                  onChange={(e) => setDemographic(field.otherKey, e.target.value)}
                  className={`w-48 rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
                    otherErr ? 'border-red-500' : 'border-border'
                  }`}
                />
              )}
            </div>
          </FieldRow>
        );
      }
      case 'asrs': {
        const inatt = asNumber(demographics[field.inattentionKey]);
        const hyper = asNumber(demographics[field.hyperactivityKey]);
        const total = inatt != null && hyper != null ? String(inatt + hyper) : null;
        const inattErr = showError(field.inattentionKey)
          ? fieldErrors[field.inattentionKey]
          : undefined;
        const hyperErr = showError(field.hyperactivityKey)
          ? fieldErrors[field.hyperactivityKey]
          : undefined;
        return (
          <div key="asrs" className="flex flex-col gap-3 rounded-sm border border-border bg-bg/40 p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {field.label}
            </span>
            <FieldRow label="Inattention" units="score" message={errorMessage(inattErr)}>
              <NumberInput
                value={inatt}
                min={0}
                max={36}
                step={1}
                nullable
                invalid={Boolean(inattErr)}
                onChange={(n) => setDemographic(field.inattentionKey, n)}
              />
            </FieldRow>
            <FieldRow label="Hyperactivity/Impulsivity" units="score" message={errorMessage(hyperErr)}>
              <NumberInput
                value={hyper}
                min={0}
                max={36}
                step={1}
                nullable
                invalid={Boolean(hyperErr)}
                onChange={(n) => setDemographic(field.hyperactivityKey, n)}
              />
            </FieldRow>
            <FieldRow label="Total" units="score">
              <ReadOnlyValue value={total} />
            </FieldRow>
          </div>
        );
      }
      case 'custom-number':
        return (
          <FieldRow
            key={field.key}
            label={field.label}
            message={errorMessage(showError(field.key) ? fieldErrors[field.key] : undefined)}
          >
            <NumberInput
              value={asNumber(demographics[field.key])}
              min={Number.MIN_SAFE_INTEGER}
              max={Number.MAX_SAFE_INTEGER}
              step={1}
              nullable
              invalid={showError(field.key) && Boolean(fieldErrors[field.key])}
              onChange={(n) => setDemographic(field.key, n)}
            />
          </FieldRow>
        );
      case 'custom-text':
        return (
          <FieldRow
            key={field.key}
            label={field.label}
            message={errorMessage(showError(field.key) ? fieldErrors[field.key] : undefined)}
          >
            <input
              type="text"
              value={(demographics[field.key] as string) ?? ''}
              maxLength={CUSTOM_TEXT_MAX}
              onBlur={() => markTouched(field.key)}
              onChange={(e) => setDemographic(field.key, e.target.value)}
              className={`w-full rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
                showError(field.key) && fieldErrors[field.key] ? 'border-red-500' : 'border-border'
              }`}
            />
          </FieldRow>
        );
      case 'custom-dropdown':
        return (
          <FieldRow
            key={field.key}
            label={field.label}
            message={errorMessage(showError(field.key) ? fieldErrors[field.key] : undefined)}
          >
            <Dropdown
              value={(demographics[field.key] as string) ?? ''}
              options={field.options}
              placeholder="Select..."
              invalid={showError(field.key) && Boolean(fieldErrors[field.key])}
              onChange={(s) => {
                setDemographic(field.key, s);
                markTouched(field.key);
              }}
            />
          </FieldRow>
        );
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-neutral-700 px-4 py-2">
        <span className="flex-1 text-sm text-white">
          Attach the gaze data file and fill in the required fields to add a case.
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="rounded-sm bg-surface px-3 py-1 text-sm text-text transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Case'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-sm bg-surface px-3 py-1 text-sm text-text transition-colors hover:bg-surface-raised"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex max-w-2xl flex-col gap-6">
          <Group title="Case">
            <FieldRow
              label="Case ID"
              message={errorMessage(showError('caseId') ? caseIdError : undefined)}
            >
              <input
                type="text"
                value={caseId}
                maxLength={CASE_ID_MAX}
                placeholder="e.g. P001, Participant_A"
                onBlur={() => markTouched('caseId')}
                onChange={(e) => setCaseId(e.target.value)}
                className={`w-full rounded-sm border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary ${
                  showError('caseId') && caseIdError ? 'border-red-500' : 'border-border'
                }`}
              />
            </FieldRow>
            <FieldRow label="Gaze Data File">
              <FileUploadZone
                file={file}
                onChange={(f) => {
                  setFile(f);
                  markTouched('file');
                }}
                error={showError('file') ? fileError : undefined}
              />
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

function asNumber(value: string | number | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

function errorMessage(text: string | undefined): { text: string; tone: 'error' } | undefined {
  return text ? { text, tone: 'error' } : undefined;
}
