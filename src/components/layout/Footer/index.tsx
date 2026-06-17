import { Check, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useThemeStore, type Theme } from '@app/store/useThemeStore';

// SIZE: 24px tall (h-6). Reserved for progress bars, zoom controls, status text.
export function Footer() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggle = useThemeStore((s) => s.toggle);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  return (
    <footer className="flex h-6 w-full shrink-0 items-center justify-between border-t border-border bg-bg px-3 text-xs text-text-muted">
      <div />
      <button
        type="button"
        onClick={toggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`${theme === 'dark' ? 'Dark' : 'Light'} mode — click to toggle, right-click for options`}
        className="flex items-center rounded-sm p-1 text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
      >
        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
      </button>
      {menu && (
        <ThemeContextMenu
          x={menu.x}
          y={menu.y}
          theme={theme}
          onSelect={(t) => {
            setTheme(t);
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </footer>
  );
}

function ThemeContextMenu({
  x,
  y,
  theme,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  theme: Theme;
  onSelect: (theme: Theme) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light Mode', icon: Sun },
    { value: 'dark', label: 'Dark Mode', icon: Moon },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      // Anchor above the cursor since the footer sits at the bottom of the window.
      style={{ left: x, bottom: window.innerHeight - y }}
      className="fixed z-50 min-w-40 overflow-hidden rounded-md border border-border bg-surface-raised py-1 shadow-overlay"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="menuitemradio"
          aria-checked={theme === value}
          onClick={() => onSelect(value)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-text transition-colors hover:bg-surface"
        >
          <Check
            size={14}
            className={`shrink-0 ${theme === value ? 'text-text' : 'text-transparent'}`}
          />
          <Icon size={14} className="shrink-0 text-text-muted" />
          {label}
        </button>
      ))}
    </div>
  );
}
