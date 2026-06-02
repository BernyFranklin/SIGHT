/// <reference types="vite/client" />

import type {
  CasesApi,
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
      cases: CasesApi;
    };
  }
}

export {};
