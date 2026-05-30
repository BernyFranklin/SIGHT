import type { Tab } from '@app/store/useWorkspaceStore';

// Stub — full implementation lands in Chunk 3.
export function NewCaseTab({ tab }: { tab: Tab }) {
  return <div className="p-6 text-sm text-text-muted">New Case ({tab.projectPath})</div>;
}
