import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useProjectStore } from '@app/store/useProjectStore';
import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

// COLOR/SIZE: pane bg = --color-surface, right border = --color-border; width 20%.
export function ProjectExplorer() {
  const open = useProjectStore((s) => s.open);
  const activePath = useProjectStore((s) => s.activePath);
  const hasMarkers = useProjectStore((s) => s.hasMarkers);
  const setActive = useProjectStore((s) => s.setActive);

  return (
    <aside className="flex h-full w-1/5 shrink-0 flex-col overflow-auto border-r border-border bg-surface">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-text-muted">
        Project Explorer
      </div>
      {open.map((p) => (
        <ProjectNode
          key={p.path}
          path={p.path}
          name={p.name}
          isActive={p.path === activePath}
          hasMarkers={!!hasMarkers[p.path]}
          onActivate={() => setActive(p.path)}
        />
      ))}
    </aside>
  );
}

function ProjectNode({
  path,
  name,
  isActive,
  hasMarkers,
  onActivate,
}: {
  path: string;
  name: string;
  isActive: boolean;
  hasMarkers: boolean;
  onActivate: () => void;
}) {
  const openTab = useWorkspaceStore((s) => s.openTab);
  const [expanded, setExpanded] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const configWrapperRef = useRef<HTMLDivElement>(null);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  useEffect(() => {
    if (!configOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!configWrapperRef.current?.contains(e.target as Node)) setConfigOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfigOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [configOpen]);

  const activeClasses = isActive ? 'bg-surface-raised' : 'bg-bg hover:bg-bg/80';
  const cogVisibility = configOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100';

  const openMarkerConfigTab = () =>
    openTab({
      id: `marker-config:${path}`,
      title: 'Marker Config',
      kind: 'marker-config',
      closable: true,
      projectPath: path,
    });

  return (
    <div className="flex flex-col">
      <div
        className={`group flex items-center gap-1 px-2 py-1 ${activeClasses}`}
      >
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
          className="flex min-w-0 flex-1 items-center gap-1 text-left text-sm font-semibold text-text"
          title={name}
          aria-expanded={expanded}
          aria-current={isActive ? 'true' : undefined}
        >
          <Chevron size={14} className="shrink-0 text-text-muted" />
          <span className="truncate">{name}</span>
        </button>
        <div ref={configWrapperRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
              setConfigOpen((v) => !v);
            }}
            aria-haspopup="menu"
            aria-expanded={configOpen}
            aria-label="Configure project"
            title="Configure project"
            className={`shrink-0 rounded-sm p-0.5 text-text-muted transition-opacity hover:text-text ${cogVisibility}`}
          >
            <Settings size={14} />
          </button>
          {configOpen && (
            <ConfigMenu
              onCreateMarkerConfig={() => {
                setConfigOpen(false);
                openMarkerConfigTab();
              }}
              onCreateProjectConfig={() => {
                setConfigOpen(false);
                openTab({
                  id: `project-config:${path}`,
                  title: 'Project Config',
                  kind: 'project-config',
                  closable: true,
                  projectPath: path,
                });
              }}
            />
          )}
        </div>
      </div>
      {expanded && (
        hasMarkers ? (
          <ConfigFolder onOpenMarkers={openMarkerConfigTab} />
        ) : (
          <div className="px-3 py-1 text-xs italic text-text-muted opacity-70">
            This project is empty!
          </div>
        )
      )}
    </div>
  );
}

function ConfigFolder({ onOpenMarkers }: { onOpenMarkers: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 px-4 py-0.5 text-left text-sm text-text hover:bg-bg/80"
        aria-expanded={expanded}
      >
        <Chevron size={12} className="shrink-0 text-text-muted" />
        <span className="truncate">Config</span>
      </button>
      {expanded && (
        <button
          type="button"
          onClick={onOpenMarkers}
          className="flex items-center gap-1 px-4 py-0.5 pl-9 text-left text-sm text-text hover:bg-bg/80"
        >
          <span className="truncate">Markers</span>
        </button>
      )}
    </div>
  );
}

function ConfigMenu({
  onCreateMarkerConfig,
  onCreateProjectConfig,
}: {
  onCreateMarkerConfig: () => void;
  onCreateProjectConfig: () => void;
}) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-1 min-w-48 overflow-hidden rounded-md border border-border bg-surface-raised py-1 shadow-overlay"
    >
      <ConfigMenuItem label="Create Marker Config" onClick={onCreateMarkerConfig} />
      <ConfigMenuItem label="Create Project Config" onClick={onCreateProjectConfig} />
    </div>
  );
}

function ConfigMenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center px-3 py-1.5 text-left text-sm text-text transition-colors hover:bg-surface"
    >
      {label}
    </button>
  );
}
