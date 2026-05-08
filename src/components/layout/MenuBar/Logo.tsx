// Placeholder logo. Swap the inner <div> for your <img>/<svg> later.
// COLOR: change `bg-[var(--color-primary)]` below to restyle the placeholder square.
export function Logo() {
  return (
    <div
      className="grid h-8 w-10 place-items-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      aria-label="SIGHT"
      role="img"
    >
      <div
        className="h-5 w-5 rounded-[var(--radius-sm)]"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
    </div>
  );
}
