import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

import { TabBar } from './TabBar';
import { TabContent } from './TabContent';

// SIZE: flex-1 fills remaining horizontal space next to ProjectExplorer.
// The placeholder shows only when no tab is active (all tabs closed).
export function Workspace() {
  const activeId = useWorkspaceStore((s) => s.activeId);

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-surface-raised">
      <TabBar />
      <div className="relative flex-1 overflow-hidden">
        {activeId ? <TabContent /> : <EmptyPlaceholder />}
      </div>
    </main>
  );
}

// SIZE: 256px square. Swap for real logo asset when it lands.
function EmptyPlaceholder() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div
        className="h-64 w-64 rounded-lg bg-border opacity-40"
        aria-label="SIGHT"
        role="img"
      />
    </div>
  );
}
