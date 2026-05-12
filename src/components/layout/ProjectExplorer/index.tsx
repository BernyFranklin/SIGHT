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
  return (
    <div className="flex flex-col">
      <div
        className="truncate px-3 py-1 text-sm font-semibold text-text"
        title={name}
      >
        {name}
      </div>
      <div className="px-3 py-1 text-xs italic text-text-muted opacity-70">
        No cases currently added
      </div>
    </div>
  );
}
