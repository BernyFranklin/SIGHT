import type { IpcMain } from 'electron';

import type { CleaningConfigOverrides } from '@cleaning';

import {
  hasCleaningReport,
  readCleaningReport,
  runCleaning,
} from '../services/cleaningService';

import { IpcChannels } from './index';

export function registerCleaningIpc(ipcMain: IpcMain): void {
  ipcMain.handle(
    IpcChannels.cleaningRun,
    (
      _event,
      projectPath: string,
      id: string,
      overrides?: CleaningConfigOverrides,
    ) => runCleaning(projectPath, id, overrides),
  );
  ipcMain.handle(
    IpcChannels.cleaningReadReport,
    (_event, projectPath: string, id: string) =>
      readCleaningReport(projectPath, id),
  );
  ipcMain.handle(
    IpcChannels.cleaningHasReport,
    (_event, projectPath: string, id: string) =>
      hasCleaningReport(projectPath, id),
  );
}
