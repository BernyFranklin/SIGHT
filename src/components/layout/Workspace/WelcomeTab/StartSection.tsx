import { FolderOpen, FolderPlus } from 'lucide-react';

import { useProjectStore } from '@app/store/useProjectStore';

export function StartSection() {
  const createProject = useProjectStore((s) => s.createProject);
  const openProject = useProjectStore((s) => s.openProject);
  const openRecent = useProjectStore((s) => s.openRecent);
  const recents = useProjectStore((s) => s.recents);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <SectionHeader>Start</SectionHeader>
        <ActionRow
          icon={<FolderPlus size={16} />}
          label="New Project"
          onClick={() => void createProject()}
        />
        <ActionRow
          icon={<FolderOpen size={16} />}
          label="Open Project"
          onClick={() => void openProject()}
        />
      </div>

      <div>
        <SectionHeader>Recent</SectionHeader>
        <ul className="flex flex-col">
          {recents.length === 0
            ? (
                <li className="px-2 py-1 text-sm italic text-text-muted opacity-60">
                  No recent projects
                </li>
              )
            : recents.slice(0, 3).map((p) => (
                <li key={p.path}>
                  <button
                    type="button"
                    onClick={() => void openRecent(p.path)}
                    className="flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-surface"
                    title={p.path}
                  >
                    <span className="text-sm text-text">{p.name}</span>
                    <span className="max-w-full truncate text-xs text-text-muted">
                      {p.path}
                    </span>
                  </button>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </h2>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-primary transition-colors hover:bg-surface"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
