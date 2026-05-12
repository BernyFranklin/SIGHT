import { X } from 'lucide-react';

import { type Tab, useWorkspaceStore } from '@app/store/useWorkspaceStore';

// COLOR: bar bg = --color-surface, active pill bg = --color-surface-raised,
// border between bar and content = --color-border. Mini logo swatch = --color-primary.
// SIZE: 36px tall bar (h-9). Pills stretch to bar height with internal padding.
export function TabBar() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeId = useWorkspaceStore((s) => s.activeId);
  const setActive = useWorkspaceStore((s) => s.setActive);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex h-9 w-full shrink-0 items-stretch border-b"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
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
  return (
    <div
      role="tab"
      aria-selected={active}
      onClick={onActivate}
      className="flex cursor-pointer items-center gap-2 border-r px-3 text-sm transition-colors"
      style={{
        backgroundColor: active ? 'var(--color-surface-raised)' : 'transparent',
        borderColor: 'var(--color-border)',
        color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
      }}
    >
      {/* Mini logo placeholder — mirrors Logo.tsx swatch idea. */}
      <span
        className="block h-3.5 w-3.5 rounded-[var(--radius-sm)]"
        style={{ backgroundColor: 'var(--color-primary)' }}
        aria-hidden
      />
      <span>{tab.title}</span>
      {tab.closable && (
        <button
          type="button"
          aria-label={`Close ${tab.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="grid h-5 w-5 place-items-center rounded-[var(--radius-sm)] transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
