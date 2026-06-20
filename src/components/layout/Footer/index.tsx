import { Check, Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useThemeStore, type Theme } from '@app/store/useThemeStore';
import { MAX_ZOOM, MIN_ZOOM, useZoomStore } from '@app/store/useZoomStore';

// SIZE: 24px tall (h-6). Reserved for progress bars, zoom controls, status text.
export function Footer() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggle = useThemeStore((s) => s.toggle);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  return (
    <footer className="flex h-6 w-full shrink-0 items-center justify-between border-t border-border bg-bg px-3 text-xs text-text-muted">
      <ZoomControl />
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

function ZoomControl() {
  const factor = useZoomStore((s) => s.factor);
  const zoomIn = useZoomStore((s) => s.zoomIn);
  const zoomOut = useZoomStore((s) => s.zoomOut);
  const reset = useZoomStore((s) => s.reset);

  const buttonClass =
    'flex items-center rounded-sm p-1 text-text-muted transition-colors hover:bg-surface-raised hover:text-text disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted';

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={zoomOut}
        disabled={factor <= MIN_ZOOM}
        aria-label="Zoom out"
        title="Zoom out"
        className={buttonClass}
      >
        <ZoomOut size={14} />
      </button>
      <button
        type="button"
        onClick={reset}
        aria-label="Reset zoom to 100%"
        title="Reset zoom to 100%"
        className="min-w-10 rounded-sm px-1 py-0.5 text-center tabular-nums text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
      >
        {Math.round(factor * 100)}%
      </button>
      <button
        type="button"
        onClick={zoomIn}
        disabled={factor >= MAX_ZOOM}
        aria-label="Zoom in"
        title="Zoom in"
        className={buttonClass}
      >
        <ZoomIn size={14} />
      </button>
    </div>
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
      // Anchor to the bottom-right of the cursor: the toggle sits in the
      // bottom-right corner, so grow the menu up and to the left to stay on-screen.
      style={{ right: window.innerWidth - x, bottom: window.innerHeight - y }}
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
