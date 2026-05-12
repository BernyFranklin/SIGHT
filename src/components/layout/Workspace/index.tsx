// COLOR: pane bg = --color-surface-raised (lightest of the shade ladder) in src/styles/tokens.css.
// SIZE: flex-1 fills remaining horizontal space next to ProjectExplorer.
// NOTE: This is the back layer. Future tabbed file views will mount above it.
//   The centered placeholder shows when no tabs are open. Swap the inner <div>
//   for an <img>/<svg> when the real logo lands.
export function Workspace() {
  return (
    <main
      className="relative flex-1 overflow-auto"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
    >
      <div className="grid h-full w-full place-items-center">
        {/* COLOR: placeholder uses --color-border so it reads as quiet/muted. */}
        {/* SIZE: 128px square. Adjust here when replacing with real asset. */}
        <div
          className="h-64 w-64 rounded-[var(--radius-lg)] opacity-40"
          style={{ backgroundColor: 'var(--color-border)' }}
          aria-label="SIGHT"
          role="img"
        />
      </div>
    </main>
  );
}
