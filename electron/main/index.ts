import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

import started from 'electron-squirrel-startup';

import { IpcChannels } from '../ipc';

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b1220',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send(IpcChannels.windowMaximizedChanged, true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send(IpcChannels.windowMaximizedChanged, false);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

};

ipcMain.handle(IpcChannels.windowMinimize, (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});
ipcMain.handle(IpcChannels.windowToggleMaximize, (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});
ipcMain.handle(IpcChannels.windowClose, (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});
ipcMain.handle(IpcChannels.windowToggleDevTools, (event) => {
  event.sender.isDevToolsOpened() ? event.sender.closeDevTools() : event.sender.openDevTools();
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
