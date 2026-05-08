import { contextBridge, ipcRenderer } from 'electron';

import { IpcChannels } from '../ipc';

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

contextBridge.exposeInMainWorld('api', { windowControls });

export type WindowControlsApi = typeof windowControls;
