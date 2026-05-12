import { dialog } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';

import Store from 'electron-store';

export interface Project {
  name: string;
  path: string;
}

interface StoreSchema {
  recentProjects: string[];
}

const MAX_RECENTS = 10;

const store = new Store<StoreSchema>({
  defaults: { recentProjects: [] },
});

function toProject(folderPath: string): Project {
  return { name: path.basename(folderPath), path: folderPath };
}

function addRecent(folderPath: string): void {
  const current = store.get('recentProjects');
  const deduped = [folderPath, ...current.filter((p) => p !== folderPath)];
  store.set('recentProjects', deduped.slice(0, MAX_RECENTS));
}

function removeRecent(folderPath: string): void {
  const current = store.get('recentProjects');
  store.set(
    'recentProjects',
    current.filter((p) => p !== folderPath),
  );
}

export async function pickNewFolder(): Promise<Project | null> {
  const result = await dialog.showOpenDialog({
    title: 'New Project',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];
  addRecent(folderPath);
  return toProject(folderPath);
}

export async function pickExistingFolder(): Promise<Project | null> {
  const result = await dialog.showOpenDialog({
    title: 'Open Project',
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folderPath = result.filePaths[0];
  addRecent(folderPath);
  return toProject(folderPath);
}

export function openRecent(folderPath: string): Project | null {
  if (!existsSync(folderPath)) {
    removeRecent(folderPath);
    return null;
  }
  addRecent(folderPath);
  return toProject(folderPath);
}

export function listRecent(): Project[] {
  return store.get('recentProjects').map(toProject);
}
