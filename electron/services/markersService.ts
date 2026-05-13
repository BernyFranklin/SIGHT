import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

const SIGHT_DIR = '.sight';
const MARKERS_FILE = 'markers.json';

function markersPath(projectPath: string): string {
  return path.join(projectPath, SIGHT_DIR, MARKERS_FILE);
}

export function hasMarkers(projectPath: string): boolean {
  return existsSync(markersPath(projectPath));
}

export async function readMarkers(projectPath: string): Promise<MarkersFile | null> {
  const file = markersPath(projectPath);
  if (!existsSync(file)) return null;
  try {
    const raw = await readFile(file, 'utf-8');
    return JSON.parse(raw) as MarkersFile;
  } catch (err) {
    console.error('[markersService] failed to read markers.json', err);
    return null;
  }
}

export async function writeMarkers(projectPath: string, data: MarkersFile): Promise<void> {
  const dir = path.join(projectPath, SIGHT_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, MARKERS_FILE), JSON.stringify(data, null, 2), 'utf-8');
}
