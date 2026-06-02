import type { IpcMain } from 'electron';

import {
  type CasesFile,
  hasCases,
  readCases,
  writeCases,
  writeGazeFile,
} from '../services/casesService';

import { IpcChannels } from './index';

export function registerCasesIpc(ipcMain: IpcMain): void {
  ipcMain.handle(IpcChannels.casesRead, (_event, projectPath: string) =>
    readCases(projectPath),
  );
  ipcMain.handle(
    IpcChannels.casesWrite,
    (_event, projectPath: string, data: CasesFile) => writeCases(projectPath, data),
  );
  ipcMain.handle(IpcChannels.casesHas, (_event, projectPath: string) =>
    hasCases(projectPath),
  );
  ipcMain.handle(
    IpcChannels.casesWriteGaze,
    (_event, projectPath: string, id: string, bytes: ArrayBuffer) =>
      writeGazeFile(projectPath, id, bytes),
  );
}
