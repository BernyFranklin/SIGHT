import { X } from 'lucide-react';

import { type Tab, useWorkspaceStore } from '@app/store/useWorkspaceStore';

// SIZE: 36px tall bar (h-9). Pills stretch to bar height with internal padding.
export function TabBar() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeId = useWorkspaceStore((s) => s.activeId);
  const setActive = useWorkspaceStore((s) => s.setActive);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex h-9 w-full shrink-0 items-stretch border-b border-border bg-surface"
      role="tablist"
    >
      {tabs.map((tab) => (
        <TabPill
          key={tab.id}
          tab={tab}
          active={tab.id === activeId}
          onActivate={() => setActive(tab.id)}
          onClose={() => closeTab(tab.id)}
        />
      ))}
    </div>
  );
}

function TabPill({
  tab,
  active,
  onActivate,
  onClose,
}: {
  tab: Tab;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const stateClasses = active
    ? 'bg-surface-raised text-text font-bold'
    : 'text-text-muted';
  return (
    <div
      role="tab"
      aria-selected={active}
      onClick={onActivate}
      className={`flex cursor-pointer items-center gap-2 border-r border-border px-3 text-sm transition-colors ${stateClasses}`}
    >
      {tab.kind === 'welcome' && (
        <span className="block h-3.5 w-3.5 rounded-sm bg-primary" aria-hidden />
      )}
      <span>{tab.title}</span>
      {tab.closable && (
        <button
          type="button"
          aria-label={`Close ${tab.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="grid h-5 w-5 place-items-center rounded-sm text-text-muted transition-colors hover:bg-border hover:text-text"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
