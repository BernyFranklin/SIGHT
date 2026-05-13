import type { Fps } from './types';

export const NAME_MAX = 20;
export const FPS_OPTIONS: readonly Fps[] = [30, 60] as const;
export const DEFAULT_FPS: Fps = 30;

export const timestampHint = (fps: Fps): string =>
  `Format HH:MM:SS:FF (FF = frame, 0–${fps - 1} at ${fps} fps). Digits auto-format as you type.`;
