import { useState } from 'react';

import { Logo } from './Logo';
import { MenuButton } from './MenuButton';
import { menuSections } from './menuConfig';
import { WindowControls } from './WindowControls';

// COLOR: bar background and bottom-border come from --color-surface / --color-border
// in src/styles/tokens.css. Edit those tokens to retheme the whole bar.
// SIZE: bar height (h-8 = 32px), logo size (Logo.tsx), and icon sizes (16px) live in their files.
export function MenuBar() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div
      className="flex h-8 w-full select-none items-stretch border-b"
      style={
        {
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties
      }
    >
      <Logo />
      <nav className="flex items-stretch" aria-label="Main menu">
        {menuSections.map((section) => (
          <MenuButton
            key={section.id}
            section={section}
            isOpen={openId === section.id}
            onOpen={() => setOpenId(section.id)}
            onClose={() => setOpenId(null)}
            onHoverWhileAnyOpen={() => {
              if (openId && openId !== section.id) setOpenId(section.id);
            }}
          />
        ))}
      </nav>
      <div className="flex-1" />
      <WindowControls />
    </div>
  );
}
