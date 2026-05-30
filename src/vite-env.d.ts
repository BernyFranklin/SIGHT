/// <reference types="vite/client" />

import type {
  MarkersApi,
  ProjectApi,
  ProjectConfigApi,
  WindowControlsApi,
} from '@electron/preload';

declare global {
  interface Window {
    api: {
      windowControls: WindowControlsApi;
      project: ProjectApi;
      markers: MarkersApi;
      projectConfig: ProjectConfigApi;
    };
  }
}

export {};
