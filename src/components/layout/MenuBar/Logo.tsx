// Placeholder logo. Swap the inner <div> for your <img>/<svg> later.
export function Logo() {
  return (
    <div
      className="grid h-8 w-10 place-items-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      aria-label="SIGHT"
      role="img"
    >
      <div className="h-5 w-5 rounded-sm bg-primary" />
    </div>
  );
}
