import type { MenuItem } from './menuConfig';

type Props = {
  items: MenuItem[];
  onSelect: () => void;
};

export function MenuDropdown({ items, onSelect }: Props) {
  return (
    <div
      role="menu"
      className="absolute left-0 top-full z-50 mt-px min-w-56 overflow-hidden rounded-md border border-border bg-surface-raised py-1 shadow-overlay"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {items.map((item, i) => {
        if (item.kind === 'separator') {
          return (
            <div
              key={`sep-${i}`}
              role="separator"
              className="my-1 h-px bg-border"
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
            className="flex w-full items-center px-3 py-1.5 text-left text-sm text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
