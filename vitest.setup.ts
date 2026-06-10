import '@testing-library/jest-dom/vitest';

// The renderer api clients (src/api/*.ts) read `window.api.<ns>` at module load,
// so a baseline stub must exist before any of them is imported. Individual tests
// override these namespaces with their own mocks as needed.
(globalThis as unknown as { window: { api: unknown } }).window ??=
  globalThis as unknown as { api: unknown };
(window as unknown as { api: unknown }).api = {
  windowControls: {},
  project: {},
  markers: {},
  projectConfig: {},
  cases: {},
  cleaning: {},
};
