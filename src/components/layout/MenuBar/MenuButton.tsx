import { useEffect, useRef } from 'react';

import type { MenuSection } from './menuConfig';
import { MenuDropdown } from './MenuDropdown';

type Props = {
  section: MenuSection;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onHoverWhileAnyOpen: () => void;
};

export function MenuButton({
  section,
  isOpen,
  onOpen,
  onClose,
  onHoverWhileAnyOpen,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) onClose();
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
  }, [isOpen, onClose]);

  const stateClasses = isOpen ? 'bg-surface-raised' : 'hover:bg-surface-raised';

  return (
    <div
      ref={wrapperRef}
      className="relative h-full"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? onClose() : onOpen())}
        onMouseEnter={onHoverWhileAnyOpen}
        className={`h-full px-3 text-sm text-text transition-colors ${stateClasses}`}
      >
        {section.label}
      </button>
      {isOpen && <MenuDropdown items={section.items} onSelect={onClose} />}
    </div>
  );
}
