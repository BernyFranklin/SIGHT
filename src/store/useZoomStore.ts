import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.0;
export const ZOOM_STEP = 0.1;
export const DEFAULT_ZOOM = 1.0;

interface ZoomState {
  factor: number;
  setFactor: (factor: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

/** Clamp to the allowed range and round to one decimal to avoid float drift. */
function normalize(factor: number): number {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, factor));
  return Math.round(clamped * 10) / 10;
}

/** Applies the zoom factor to the window via the preload `webFrame` bridge. */
export function applyZoom(factor: number): void {
  window.api?.zoom.set(factor);
}

export const useZoomStore = create<ZoomState>()(
  persist(
    (set, get) => {
      const apply = (factor: number) => {
        const next = normalize(factor);
        applyZoom(next);
        set({ factor: next });
      };
      return {
        factor: DEFAULT_ZOOM,
        setFactor: (factor) => apply(factor),
        zoomIn: () => apply(get().factor + ZOOM_STEP),
        zoomOut: () => apply(get().factor - ZOOM_STEP),
        reset: () => apply(DEFAULT_ZOOM),
      };
    },
    {
      name: 'sight-zoom',
      partialize: (state) => ({ factor: state.factor }),
    },
  ),
);
