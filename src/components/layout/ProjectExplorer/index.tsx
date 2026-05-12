import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@app/store/useProjectStore';

// COLOR/SIZE: pane bg = --color-surface, right border = --color-border; width 20%.
export function ProjectExplorer() {
  const open = useProjectStore((s) => s.open);
  const activePath = useProjectStore((s) => s.activePath);
  const setActive = useProjectStore((s) => s.setActive);

  return (
    <aside className="flex h-full w-1/5 shrink-0 flex-col overflow-auto border-r border-border bg-surface">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-text-muted">
        Project Explorer
      </div>
      {open.map((p) => (
        <ProjectNode
          key={p.path}
          name={p.name}
          isActive={p.path === activePath}
          onActivate={() => setActive(p.path)}
        />
      ))}
    </aside>
  );
}

function ProjectNode({
  name,
  isActive,
  onActivate,
}: {
  name: string;
  isActive: boolean;
  onActivate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  const activeClasses = isActive ? 'bg-surface-raised' : 'bg-bg hover:bg-bg/80';

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => {
          onActivate();
          setExpanded((v) => !v);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onActivate();
        }}
        className={`flex items-center gap-1 px-2 py-1 text-left text-sm font-semibold text-text ${activeClasses}`}
        title={name}
        aria-expanded={expanded}
        aria-current={isActive ? 'true' : undefined}
      >
        <Chevron size={14} className="shrink-0 text-text-muted" />
        <span className="truncate">{name}</span>
      </button>
      {expanded && (
        <div className="px-3 py-1 text-xs italic text-text-muted opacity-70">
          No cases currently added
        </div>
      )}
    </div>
  );
}
