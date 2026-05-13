import { contextBridge, ipcRenderer } from 'electron';

import { IpcChannels } from '../ipc';

export interface Project {
  name: string;
  path: string;
}

export interface Marker {
  id: number;
  name: string;
  startFrame: number;
  endFrame: number;
}

export type Fps = 30 | 60;

export interface MarkersFile {
  name: string;
  fps: Fps;
  markers: Marker[];
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

const markers = {
  read: (projectPath: string): Promise<MarkersFile | null> =>
    ipcRenderer.invoke(IpcChannels.markersRead, projectPath),
  write: (projectPath: string, data: MarkersFile): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.markersWrite, projectPath, data),
  has: (projectPath: string): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.markersHas, projectPath),
};

contextBridge.exposeInMainWorld('api', { windowControls, project, markers });

export type WindowControlsApi = typeof windowControls;
export type ProjectApi = typeof project;
export type MarkersApi = typeof markers;
