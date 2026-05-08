/// <reference types="vite/client" />

import type { WindowControlsApi } from '@electron/preload';

declare global {
  interface Window {
    api: {
      windowControls: WindowControlsApi;
    };
  }
}

export {};
