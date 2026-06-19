import { useEffect } from 'react';

import { Footer } from '@app/components/layout/Footer';
import { MenuBar } from '@app/components/layout/MenuBar';
import { ProjectExplorer } from '@app/components/layout/ProjectExplorer';
import { Workspace } from '@app/components/layout/Workspace';
import { useProjectStore } from '@app/store/useProjectStore';
import { useZoomStore } from '@app/store/useZoomStore';

export function App() {
  useEffect(() => {
    void useProjectStore.getState().loadRecents();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const { zoomIn, zoomOut, reset } = useZoomStore.getState();
      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          reset();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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
