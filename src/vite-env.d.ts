/// <reference types="vite/client" />

import type { MarkersApi, ProjectApi, WindowControlsApi } from '@electron/preload';

declare global {
  interface Window {
    api: {
      windowControls: WindowControlsApi;
      project: ProjectApi;
      markers: MarkersApi;
    };
  }
}

export {};
