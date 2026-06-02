import { useMemo, useState } from 'react';

import { casesApi } from '@app/api/cases';
import { type CaseRecord, useProjectStore } from '@app/store/useProjectStore';
import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

import { type CaseField, deriveCaseFields } from './schema';
import { validateCase } from './validation';

function newCaseId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `case-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Keep only the values that belong to the current schema, defaulting to null. */
function collectDemographics(
  fields: CaseField[],
  demographics: Record<string, string | number | null>,
): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const field of fields) {
    if (field.kind === 'gender') {
      out[field.key] = demographics[field.key] ?? null;
      out[field.otherKey] = demographics[field.otherKey] ?? null;
    } else if (field.kind === 'asrs') {
      out[field.inattentionKey] = demographics[field.inattentionKey] ?? null;
      out[field.hyperactivityKey] = demographics[field.hyperactivityKey] ?? null;
    } else {
      out[field.key] = demographics[field.key] ?? null;
    }
  }
  return out;
}

export function useNewCase(projectPath: string, tabId: string) {
  const config = useProjectStore((s) => s.projectConfigs[projectPath] ?? null);
  const projectCases = useProjectStore((s) => s.cases[projectPath]);
  const refreshCases = useProjectStore((s) => s.refreshCases);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  const fields = useMemo(() => deriveCaseFields(config), [config]);

  const [caseId, setCaseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [demographics, setDemographics] = useState<Record<string, string | number | null>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingCaseIds = useMemo(
    () => (projectCases ?? []).map((c) => c.caseId),
    [projectCases],
  );

  const { caseIdError, fileError, fieldErrors } = useMemo(
    () => validateCase({ caseId, file, demographics, fields, existingCaseIds }),
    [caseId, file, demographics, fields, existingCaseIds],
  );

  const hasErrors =
    Boolean(caseIdError) || Boolean(fileError) || Object.keys(fieldErrors).length > 0;
  // Button gating per spec: file attached + case ID filled. Full validation runs on submit.
  const canSubmit = Boolean(file) && caseId.trim().length > 0;

  const showError = (key: string) => submitAttempted || touched.has(key);
  const markTouched = (key: string) =>
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

  const setDemographic = (key: string, value: string | number | null) =>
    setDemographics((prev) => ({ ...prev, [key]: value }));

  const handleCancel = () => closeTab(tabId);

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || hasErrors || !file || saving) return;
    const record: CaseRecord = {
      id: newCaseId(),
      caseId: caseId.trim(),
      fileName: file.name,
      fileSize: file.size,
      demographics: collectDemographics(fields, demographics),
    };
    setSaving(true);
    try {
      const bytes = await file.arrayBuffer();
      await casesApi.writeGaze(projectPath, record.id, bytes);
      const existing = useProjectStore.getState().cases[projectPath] ?? [];
      await casesApi.write(projectPath, { cases: [...existing, record] });
      await refreshCases(projectPath);
      closeTab(tabId);
    } catch (err) {
      console.error('[useNewCase] failed to save case', err);
      setSaving(false);
    }
  };

  return {
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
  };
}
