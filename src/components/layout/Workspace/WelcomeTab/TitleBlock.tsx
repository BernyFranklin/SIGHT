// COLOR: title = --color-text, subtitle = --color-text-muted.
export function TitleBlock() {
  return (
    <div className="text-left">
      <h1
        className="text-5xl font-semibold tracking-tight"
        style={{ color: 'var(--color-text)' }}
      >
        SIGHT
      </h1>
      <p
        className="mt-2 text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Saccadic Interval and Gaze Heuristic Toolkit
      </p>
    </div>
  );
}
