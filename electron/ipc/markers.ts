import type { IpcMain } from 'electron';

import {
  hasMarkers,
  readMarkers,
  writeMarkers,
  type MarkersFile,
} from '../services/markersService';

import { IpcChannels } from './index';

export function registerMarkersIpc(ipcMain: IpcMain): void {
  ipcMain.handle(IpcChannels.markersRead, (_event, projectPath: string) =>
    readMarkers(projectPath),
  );
  ipcMain.handle(
    IpcChannels.markersWrite,
    (_event, projectPath: string, data: MarkersFile) =>
      writeMarkers(projectPath, data),
  );
  ipcMain.handle(IpcChannels.markersHas, (_event, projectPath: string) =>
    hasMarkers(projectPath),
  );
}
