import type { IpcMain } from 'electron';

import {
  hasSaccadeReport,
  readSaccadeReport,
  runSaccadeAnalysis,
} from '../services/saccadeService';

import { IpcChannels } from './index';

export function registerSaccadeIpc(ipcMain: IpcMain): void {
  ipcMain.handle(
    IpcChannels.saccadeRun,
    (_event, projectPath: string, id: string) =>
      runSaccadeAnalysis(projectPath, id),
  );
  ipcMain.handle(
    IpcChannels.saccadeReadReport,
    (_event, projectPath: string, id: string) =>
      readSaccadeReport(projectPath, id),
  );
  ipcMain.handle(
    IpcChannels.saccadeHasReport,
    (_event, projectPath: string, id: string) =>
      hasSaccadeReport(projectPath, id),
  );
}
