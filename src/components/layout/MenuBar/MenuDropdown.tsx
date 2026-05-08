import type { MenuItem } from './menuConfig';

type Props = {
  items: MenuItem[];
  onSelect: () => void;
};

// COLOR: panel bg/border/shadow/hover are driven by tokens in src/styles/tokens.css
// (--color-surface-raised, --color-border, --shadow-overlay, --color-surface).
export function MenuDropdown({ items, onSelect }: Props) {
  return (
    <div
      role="menu"
      className="absolute left-0 top-full z-50 mt-px min-w-56 overflow-hidden border py-1"
      style={
        {
          backgroundColor: 'var(--color-surface-raised)',
          borderColor: 'var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-overlay)',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties
      }
    >
      {items.map((item, i) => {
        if (item.kind === 'separator') {
          return (
            <div
              key={`sep-${i}`}
              role="separator"
              className="my-1 h-px"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
          );
        }
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect?.();
              onSelect();
            }}
            // COLOR: hover background uses --color-surface; tweak here for menu item hover.
            className="flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--color-text)' }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
