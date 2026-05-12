// COLOR: pane bg = --color-surface, right border = --color-border (src/styles/tokens.css).
// SIZE: width fixed at 20% of parent row; flex-shrink: 0 keeps it from collapsing.
export function ProjectExplorer() {
  return (
    <aside
      className="flex h-full flex-col overflow-auto border-r"
      style={{
        width: '20%',
        flexShrink: 0,
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="px-3 py-2 text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Project Explorer
      </div>
    </aside>
  );
}
