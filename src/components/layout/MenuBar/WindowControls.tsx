import { Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const off = window.api?.windowControls.onMaximizedChanged?.(setIsMaximized);
    return () => off?.();
  }, []);

  const api = window.api?.windowControls;

  return (
    <div
      className="flex h-full"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <ControlButton aria-label="Minimize" onClick={() => api?.minimize()}>
        <Minus size={16} />
      </ControlButton>
      <ControlButton
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
        onClick={() => api?.toggleMaximize()}
      >
        {isMaximized ? <Copy size={14} /> : <Square size={14} />}
      </ControlButton>
      <ControlButton aria-label="Close" danger onClick={() => api?.close()}>
        <X size={16} />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  children,
  danger,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  const hoverBg = danger ? 'hover:bg-danger' : 'hover:bg-surface-raised';
  return (
    <button
      type="button"
      {...rest}
      className={`grid h-full w-12 place-items-center text-text-muted transition-colors hover:text-text ${hoverBg}`}
    >
      {children}
    </button>
  );
}
