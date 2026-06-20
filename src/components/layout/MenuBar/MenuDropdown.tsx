import { Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import type { MenuItem } from './menuConfig';

type Props = {
  items: MenuItem[];
  onSelect: () => void;
  side?: 'bottom' | 'right';
};

export function MenuDropdown({ items, onSelect, side = 'bottom' }: Props) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const positionClasses =
    side === 'right'
      ? 'absolute left-full top-0 ml-px'
      : 'absolute left-0 top-full mt-px';

  return (
    <div
      role="menu"
      className={`${positionClasses} z-50 min-w-56 overflow-visible rounded-md border border-border bg-surface-raised py-1 shadow-overlay`}
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
        if (item.kind === 'submenu') {
          const isOpen = openSubmenu === item.label;
          return (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => !item.disabled && setOpenSubmenu(item.label)}
              onMouseLeave={() =>
                setOpenSubmenu((cur) => (cur === item.label ? null : cur))
              }
            >
              <button
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                disabled={item.disabled}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{item.label}</span>
                <ChevronRight size={14} className="text-text-muted" />
              </button>
              {isOpen && (
                <MenuDropdown
                  items={item.items}
                  onSelect={onSelect}
                  side="right"
                />
              )}
            </div>
          );
        }
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onMouseEnter={() => setOpenSubmenu(null)}
            onClick={() => {
              item.onSelect?.();
              onSelect();
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item.checked !== undefined && (
              <Check
                size={14}
                className={`shrink-0 ${item.checked ? 'text-text' : 'text-transparent'}`}
              />
            )}
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-auto pl-4 font-mono text-xs text-text-muted">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
