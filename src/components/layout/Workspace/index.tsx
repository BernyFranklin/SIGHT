// COLOR: pane bg = --color-surface-raised (lightest of the shade ladder) in src/styles/tokens.css.
// SIZE: flex-1 fills remaining horizontal space next to ProjectExplorer.
export function Workspace() {
  return (
    <main
      className="flex-1 overflow-auto"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
    />
  );
}
