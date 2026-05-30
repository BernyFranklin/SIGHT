import type { Tab } from '@app/store/useWorkspaceStore';

// Stub — full implementation lands in Chunk 4.
export function CaseTab({ tab }: { tab: Tab }) {
  return <div className="p-6 text-sm text-text-muted">Case ({tab.caseRecordId})</div>;
}
