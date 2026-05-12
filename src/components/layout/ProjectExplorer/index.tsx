import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@app/store/useProjectStore';

// COLOR/SIZE: pane bg = --color-surface, right border = --color-border; width 20%.
export function ProjectExplorer() {
  const current = useProjectStore((s) => s.current);

  return (
    <aside className="flex h-full w-1/5 shrink-0 flex-col overflow-auto border-r border-border bg-surface">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-text-muted">
        Project Explorer
      </div>
      {current && <Loaded name={current.name} />}
    </aside>
  );
}

function Loaded({ name }: { name: string }) {
  const [expanded, setExpanded] = useState(true);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 bg-bg px-2 py-1 text-left text-sm font-semibold text-text hover:bg-bg/80"
        title={name}
        aria-expanded={expanded}
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
