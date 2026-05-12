/// <reference types="vite/client" />

import type { ProjectApi, WindowControlsApi } from '@electron/preload';

declare global {
  interface Window {
    api: {
      windowControls: WindowControlsApi;
      project: ProjectApi;
    };
  }
}

export {};
