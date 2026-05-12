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
    <div className="flex h-screen flex-col bg-bg text-text">
      <MenuBar />
      <div className="flex flex-1 overflow-hidden">
        <ProjectExplorer />
        <Workspace />
      </div>
      <Footer />
    </div>
  );
}
