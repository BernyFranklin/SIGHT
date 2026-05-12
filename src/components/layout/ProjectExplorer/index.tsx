import { useProjectStore } from '@app/store/useProjectStore';

// COLOR/SIZE: pane bg = --color-surface, right border = --color-border; width 20%.
export function ProjectExplorer() {
  const current = useProjectStore((s) => s.current);

  return (
    <aside
      className="flex h-full shrink-0 flex-col overflow-auto border-r border-border bg-surface"
      style={{ width: '20%' }}
    >
      {current ? <Loaded name={current.name} /> : <Empty />}
    </aside>
  );
}

function Empty() {
  return (
    <div className="px-3 py-2 text-xs uppercase tracking-wide text-text-muted">
      No project open
    </div>
  );
}

function Loaded({ name }: { name: string }) {
  return (
    <div className="flex flex-col">
      <div
        className="truncate px-3 py-2 text-sm font-semibold text-text"
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
