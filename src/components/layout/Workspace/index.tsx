import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

import { TabBar } from './TabBar';
import { TabContent } from './TabContent';

// COLOR: pane bg = --color-surface-raised (lightest of the shade ladder) in src/styles/tokens.css.
// SIZE: flex-1 fills remaining horizontal space next to ProjectExplorer.
// The placeholder shows only when no tab is active (all tabs closed).
export function Workspace() {
  const activeId = useWorkspaceStore((s) => s.activeId);

  return (
    <main
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
    >
      <TabBar />
      <div className="relative flex-1 overflow-hidden">
        {activeId ? <TabContent /> : <EmptyPlaceholder />}
      </div>
    </main>
  );
}

// COLOR: placeholder uses --color-border so it reads as quiet/muted.
// SIZE: 256px square (h-64/w-64). Swap for real logo asset when it lands.
function EmptyPlaceholder() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div
        className="h-64 w-64 rounded-[var(--radius-lg)] opacity-40"
        style={{ backgroundColor: 'var(--color-border)' }}
        aria-label="SIGHT"
        role="img"
      />
    </div>
  );
}
