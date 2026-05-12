import { contextBridge, ipcRenderer } from 'electron';

import { IpcChannels } from '../ipc';

export interface Project {
  name: string;
  path: string;
}

const windowControls = {
  minimize: () => ipcRenderer.invoke(IpcChannels.windowMinimize),
  toggleMaximize: () => ipcRenderer.invoke(IpcChannels.windowToggleMaximize),
  close: () => ipcRenderer.invoke(IpcChannels.windowClose),
  toggleDevTools: () => ipcRenderer.invoke(IpcChannels.windowToggleDevTools),
  onMaximizedChanged: (cb: (isMaximized: boolean) => void) => {
    const listener = (_: unknown, isMaximized: boolean) => cb(isMaximized);
    ipcRenderer.on(IpcChannels.windowMaximizedChanged, listener);
    return () => {
      ipcRenderer.off(IpcChannels.windowMaximizedChanged, listener);
    };
  },
};

const project = {
  create: (): Promise<Project | null> =>
    ipcRenderer.invoke(IpcChannels.projectCreate),
  open: (): Promise<Project | null> =>
    ipcRenderer.invoke(IpcChannels.projectOpen),
  openRecent: (path: string): Promise<Project | null> =>
    ipcRenderer.invoke(IpcChannels.projectOpenRecent, path),
  listRecent: (): Promise<Project[]> =>
    ipcRenderer.invoke(IpcChannels.projectListRecent),
};

contextBridge.exposeInMainWorld('api', { windowControls, project });

export type WindowControlsApi = typeof windowControls;
export type ProjectApi = typeof project;
