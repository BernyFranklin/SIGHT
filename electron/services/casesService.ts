import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface PersistedCase {
  id: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  demographics: Record<string, string | number | null>;
}

export interface CasesFile {
  cases: PersistedCase[];
}

const SIGHT_DIR = '.sight';
const CASES_FILE = 'cases.json';
const CASES_DIR = 'cases';

function casesPath(projectPath: string): string {
  return path.join(projectPath, SIGHT_DIR, CASES_FILE);
}

function gazeFilePath(projectPath: string, id: string): string {
  return path.join(projectPath, SIGHT_DIR, CASES_DIR, `${id}.csv`);
}

export function hasCases(projectPath: string): boolean {
  return existsSync(casesPath(projectPath));
}

export async function readCases(projectPath: string): Promise<CasesFile | null> {
  const file = casesPath(projectPath);
  if (!existsSync(file)) return null;
  try {
    const raw = await readFile(file, 'utf-8');
    return JSON.parse(raw) as CasesFile;
  } catch (err) {
    console.error('[casesService] failed to read cases.json', err);
    return null;
  }
}

export async function writeCases(projectPath: string, data: CasesFile): Promise<void> {
  const dir = path.join(projectPath, SIGHT_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(casesPath(projectPath), JSON.stringify(data, null, 2), 'utf-8');
}

export async function writeGazeFile(
  projectPath: string,
  id: string,
  bytes: ArrayBuffer,
): Promise<void> {
  const dir = path.join(projectPath, SIGHT_DIR, CASES_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(gazeFilePath(projectPath, id), Buffer.from(bytes));
}
