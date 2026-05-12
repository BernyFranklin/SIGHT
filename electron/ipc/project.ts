import type { IpcMain } from 'electron';

import {
  listRecent,
  openRecent,
  pickExistingFolder,
  pickNewFolder,
} from '../services/projectService';

import { IpcChannels } from './index';

export function registerProjectIpc(ipcMain: IpcMain): void {
  ipcMain.handle(IpcChannels.projectCreate, () => pickNewFolder());
  ipcMain.handle(IpcChannels.projectOpen, () => pickExistingFolder());
  ipcMain.handle(IpcChannels.projectOpenRecent, (_event, folderPath: string) =>
    openRecent(folderPath),
  );
  ipcMain.handle(IpcChannels.projectListRecent, () => listRecent());
}
