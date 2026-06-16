import type { IpcMain } from 'electron';

export const IpcChannels = {
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowMaximizedChanged: 'window:maximized-changed',
  windowToggleDevTools: 'window:toggle-devtools',
  projectCreate: 'project:create',
  projectOpen: 'project:open',
  projectOpenRecent: 'project:open-recent',
  projectListRecent: 'project:list-recent',
  markersRead: 'markers:read',
  markersWrite: 'markers:write',
  markersHas: 'markers:has',
  projectConfigRead: 'project-config:read',
  projectConfigWrite: 'project-config:write',
  projectConfigHas: 'project-config:has',
  casesRead: 'cases:read',
  casesWrite: 'cases:write',
  casesHas: 'cases:has',
  casesWriteGaze: 'cases:write-gaze',
  casesDelete: 'cases:delete',
  cleaningRun: 'cleaning:run',
  cleaningReadReport: 'cleaning:read-report',
  cleaningHasReport: 'cleaning:has-report',
  saccadeRun: 'saccade:run',
  saccadeReadReport: 'saccade:read-report',
  saccadeHasReport: 'saccade:has-report',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export function registerIpcHandlers(_ipcMain: IpcMain): void {
  // Namespace routers (user, case, profile, csv, video, stream) register here.
  // Currently each namespace registers itself directly in main/index.ts;
  // this aggregator activates once we have 2+ namespaces.
}
