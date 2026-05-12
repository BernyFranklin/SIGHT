import { useEffect } from 'react';

import { Footer } from '@app/components/layout/Footer';
import { MenuBar } from '@app/components/layout/MenuBar';
import { ProjectExplorer } from '@app/components/layout/ProjectExplorer';
import { Workspace } from '@app/components/layout/Workspace';
import { useProjectStore } from '@app/store/useProjectStore';

export function App() {
  useEffect(() => {
    void useProjectStore.getState().loadRecents();
  }, []);

  return (
    // COLOR: page bg/text live in src/styles/tokens.css (--color-bg, --color-text).
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      <MenuBar />
      <div className="flex flex-1 overflow-hidden">
        <ProjectExplorer />
        <Workspace />
      </div>
      <Footer />
    </div>
  );
}
