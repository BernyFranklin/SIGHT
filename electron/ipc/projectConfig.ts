import type { IpcMain } from 'electron';

import {
  hasProjectConfig,
  readProjectConfig,
  writeProjectConfig,
  type ProjectConfigFile,
} from '../services/projectConfigService';

import { IpcChannels } from './index';

export function registerProjectConfigIpc(ipcMain: IpcMain): void {
  ipcMain.handle(IpcChannels.projectConfigRead, (_event, projectPath: string) =>
    readProjectConfig(projectPath),
  );
  ipcMain.handle(
    IpcChannels.projectConfigWrite,
    (_event, projectPath: string, data: ProjectConfigFile) =>
      writeProjectConfig(projectPath, data),
  );
  ipcMain.handle(IpcChannels.projectConfigHas, (_event, projectPath: string) =>
    hasProjectConfig(projectPath),
  );
}
