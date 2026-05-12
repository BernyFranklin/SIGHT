import { FolderOpen } from 'lucide-react';

// COLOR: section header = --color-text-muted; action row hover = --color-surface;
// "no recent" rows = --color-text-muted at lower opacity.
export function StartSection() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <SectionHeader>Start</SectionHeader>
        <ActionRow
          icon={<FolderOpen size={16} />}
          label="Open Project"
          onClick={() => {
            // TODO: wire IPC -> electron main -> dialog.showOpenDialog,
            // then dispatch openTab() or load project into state.
            // eslint-disable-next-line no-console
            console.info('[TODO] Open Project — wire IPC + dialog.showOpenDialog');
          }}
        />
      </div>

      <div>
        <SectionHeader>Recent</SectionHeader>
        <ul className="flex flex-col">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="px-2 py-1 text-sm italic"
              style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
            >
              No recent projects
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'var(--color-text-muted)' }}
    >
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
      className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm transition-colors"
      style={{ color: 'var(--color-primary)' }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
