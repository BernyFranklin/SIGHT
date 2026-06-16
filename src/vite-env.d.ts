/// <reference types="vite/client" />

import type {
  CasesApi,
  CleaningApi,
  MarkersApi,
  ProjectApi,
  ProjectConfigApi,
  SaccadeApi,
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
      cleaning: CleaningApi;
      saccade: SaccadeApi;
    };
  }
}

export {};
