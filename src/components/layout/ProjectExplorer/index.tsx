import { ChevronDown, ChevronRight, Pencil, Settings, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { casesApi } from '@app/api/cases';
import type { ProjectConfigFile } from '@app/api/projectConfig';
import { ConfirmDialog } from '@app/components/common/ConfirmDialog';
import { type CaseRecord, useProjectStore } from '@app/store/useProjectStore';
import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

import { isCaseIncomplete } from '../Workspace/NewCaseTab/schema';

// COLOR/SIZE: pane bg = --color-surface, right border = --color-border; width 20%.
export function ProjectExplorer() {
  const open = useProjectStore((s) => s.open);
  const activePath = useProjectStore((s) => s.activePath);
  const hasMarkers = useProjectStore((s) => s.hasMarkers);
  const hasProjectConfig = useProjectStore((s) => s.hasProjectConfig);
  const cases = useProjectStore((s) => s.cases);
  const projectConfigs = useProjectStore((s) => s.projectConfigs);
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
          hasProjectConfig={!!hasProjectConfig[p.path]}
          cases={cases[p.path] ?? EMPTY_CASES}
          config={projectConfigs[p.path] ?? null}
          onActivate={() => setActive(p.path)}
        />
      ))}
    </aside>
  );
}

const EMPTY_CASES: CaseRecord[] = [];

function ProjectNode({
  path,
  name,
  isActive,
  hasMarkers,
  hasProjectConfig,
  cases,
  config,
  onActivate,
}: {
  path: string;
  name: string;
  isActive: boolean;
  hasMarkers: boolean;
  hasProjectConfig: boolean;
  cases: CaseRecord[];
  config: ProjectConfigFile | null;
  onActivate: () => void;
}) {
  const openTab = useWorkspaceStore((s) => s.openTab);
  const closeTab = useWorkspaceStore((s) => s.closeTab);
  const refreshCases = useProjectStore((s) => s.refreshCases);
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
  const iconVisibility = 'opacity-0 group-hover:opacity-100 focus:opacity-100';
  const cogVisibility = configOpen ? 'opacity-100' : iconVisibility;

  const openMarkerConfigTab = () =>
    openTab({
      id: `marker-config:${path}`,
      title: 'Marker Config',
      kind: 'marker-config',
      closable: true,
      projectPath: path,
    });

  const openProjectConfigTab = () =>
    openTab({
      id: `project-config:${path}`,
      title: 'Project Config',
      kind: 'project-config',
      closable: true,
      projectPath: path,
    });

  const openNewCaseTab = () =>
    openTab({
      id: `new-case:${path}`,
      title: 'New Case',
      kind: 'new-case',
      closable: true,
      projectPath: path,
    });

  const openCaseTab = (record: CaseRecord) =>
    openTab({
      id: `case:${path}:${record.id}`,
      title: record.caseId,
      kind: 'case',
      closable: true,
      projectPath: path,
      caseRecordId: record.id,
    });

  const openEditCaseTab = (record: CaseRecord) =>
    openTab({
      id: `edit-case:${path}:${record.id}`,
      title: `Edit: ${record.caseId}`,
      kind: 'edit-case',
      closable: true,
      projectPath: path,
      caseRecordId: record.id,
    });

  const deleteCase = async (record: CaseRecord) => {
    try {
      await casesApi.delete(path, record.id);
      await refreshCases(path);
      closeTab(`case:${path}:${record.id}`);
      closeTab(`edit-case:${path}:${record.id}`);
    } catch (err) {
      console.error('[ProjectExplorer] failed to delete case', err);
    }
  };

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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onActivate();
            openNewCaseTab();
          }}
          aria-label="Add Case"
          title="Add Case"
          className={`shrink-0 rounded-sm p-0.5 text-text-muted transition-opacity hover:text-text ${iconVisibility}`}
        >
          <UserPlus size={14} />
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
            aria-label="Configure Project"
            title="Configure Project"
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
                openProjectConfigTab();
              }}
            />
          )}
        </div>
      </div>
      {expanded && (
        hasMarkers || hasProjectConfig || cases.length > 0 ? (
          <>
            {(hasMarkers || hasProjectConfig) && (
              <ConfigFolder
                hasMarkers={hasMarkers}
                hasProjectConfig={hasProjectConfig}
                onOpenMarkers={openMarkerConfigTab}
                onOpenProject={openProjectConfigTab}
              />
            )}
            {cases.length > 0 && (
              <CasesFolder
                cases={cases}
                config={config}
                onOpenCase={openCaseTab}
                onEditCase={openEditCaseTab}
                onDeleteCase={deleteCase}
              />
            )}
          </>
        ) : (
          <div className="px-3 py-1 text-xs italic text-text-muted opacity-70">
            This project is empty!
          </div>
        )
      )}
    </div>
  );
}

function CasesFolder({
  cases,
  config,
  onOpenCase,
  onEditCase,
  onDeleteCase,
}: {
  cases: CaseRecord[];
  config: ProjectConfigFile | null;
  onOpenCase: (record: CaseRecord) => void;
  onEditCase: (record: CaseRecord) => void;
  onDeleteCase: (record: CaseRecord) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [menu, setMenu] = useState<{ record: CaseRecord; x: number; y: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CaseRecord | null>(null);
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
        <span className="truncate">Cases</span>
      </button>
      {expanded &&
        cases.map((c) => {
          const incomplete = isCaseIncomplete(c, config);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpenCase(c)}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ record: c, x: e.clientX, y: e.clientY });
              }}
              className="flex items-center gap-1.5 px-4 py-0.5 pl-9 text-left text-sm text-text hover:bg-bg/80"
              title={incomplete ? `${c.caseId} (incomplete)` : c.caseId}
            >
              {incomplete && (
                <span
                  className="shrink-0 rounded-full bg-amber-400"
                  style={{ width: 6, height: 6 }}
                  aria-hidden
                />
              )}
              <span className="truncate">{c.caseId}</span>
              {incomplete && <span className="shrink-0 text-xs text-amber-400">incomplete</span>}
            </button>
          );
        })}
      {menu && (
        <CaseContextMenu
          x={menu.x}
          y={menu.y}
          onEdit={() => {
            onEditCase(menu.record);
            setMenu(null);
          }}
          onDelete={() => {
            setPendingDelete(menu.record);
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          message={`Delete case "${pendingDelete.caseId}"? Its gaze data file will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            onDeleteCase(pendingDelete);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function CaseContextMenu({
  x,
  y,
  onEdit,
  onDelete,
  onClose,
}: {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ top: y, left: x }}
      className="fixed z-50 min-w-40 overflow-hidden rounded-md border border-border bg-surface-raised py-1 shadow-overlay"
    >
      <button
        type="button"
        role="menuitem"
        onClick={onEdit}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-text transition-colors hover:bg-surface"
      >
        <Pencil size={14} className="shrink-0 text-text-muted" />
        Edit
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onDelete}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-400 transition-colors hover:bg-surface"
      >
        <Trash2 size={14} className="shrink-0" />
        Delete
      </button>
    </div>
  );
}

function ConfigFolder({
  hasMarkers,
  hasProjectConfig,
  onOpenMarkers,
  onOpenProject,
}: {
  hasMarkers: boolean;
  hasProjectConfig: boolean;
  onOpenMarkers: () => void;
  onOpenProject: () => void;
}) {
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
        <>
          {hasMarkers && (
            <button
              type="button"
              onClick={onOpenMarkers}
              className="flex items-center gap-1 px-4 py-0.5 pl-9 text-left text-sm text-text hover:bg-bg/80"
            >
              <span className="truncate">Markers</span>
            </button>
          )}
          {hasProjectConfig && (
            <button
              type="button"
              onClick={onOpenProject}
              className="flex items-center gap-1 px-4 py-0.5 pl-9 text-left text-sm text-text hover:bg-bg/80"
            >
              <span className="truncate">Project</span>
            </button>
          )}
        </>
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
