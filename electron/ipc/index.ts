import type { IpcMain } from 'electron';

export const IpcChannels = {
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowMaximizedChanged: 'window:maximized-changed',
  windowToggleDevTools: 'window:toggle-devtools',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export function registerIpcHandlers(_ipcMain: IpcMain): void {
  // Namespace routers (user, case, profile, csv, video, stream) register here.
}
