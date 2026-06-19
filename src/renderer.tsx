import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@app/App';
import { applyTheme, useThemeStore } from '@app/store/useThemeStore';
import { applyZoom, useZoomStore } from '@app/store/useZoomStore';

import '@app/styles/globals.css';

// Apply the persisted theme before the first paint to avoid a flash. The persist
// middleware hydrates from localStorage synchronously, so getState() is correct here.
applyTheme(useThemeStore.getState().theme);
applyZoom(useZoomStore.getState().factor);

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
