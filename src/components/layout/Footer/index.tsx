// COLOR: footer bg = --color-bg (darkest), top border = --color-border, text = --color-text-muted.
// SIZE: 24px tall (h-6). Reserved for progress bars, zoom controls, status text.
export function Footer() {
  return (
    <footer
      className="flex h-6 w-full shrink-0 items-center border-t px-3 text-xs"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-muted)',
      }}
    />
  );
}
