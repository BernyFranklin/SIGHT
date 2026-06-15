import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { CleaningConfigOverrides, QaReport } from '@cleaning';
import { cleanRecording } from '@cleaning/pipeline/cleanRecording';

/**
 * Bridges the gaze cleaning library to a project's on-disk layout. A case's raw
 * gaze CSV lives at `<project>/.sight/cases/<id>.csv` (written by casesService);
 * cleaning artifacts are written under `<project>/.sight/cleaned/<id>/`.
 *
 * NOTE: a full recording can be hundreds of thousands of rows, and cleaning runs
 * synchronously on the main process here. If that becomes a UI-jank problem,
 * move {@link runCleaning} into a worker_threads/utility process.
 */

const SIGHT_DIR = '.sight';
const CASES_DIR = 'cases';
const CLEANED_DIR = 'cleaned';

function gazeFilePath(projectPath: string, id: string): string {
  return path.join(projectPath, SIGHT_DIR, CASES_DIR, `${id}.csv`);
}

function cleanedDir(projectPath: string, id: string): string {
  return path.join(projectPath, SIGHT_DIR, CLEANED_DIR, id);
}

function reportPath(projectPath: string, id: string): string {
  return path.join(cleanedDir(projectPath, id), `${id}.qa.json`);
}

/** Whether a cleaning report already exists for this case. */
export function hasCleaningReport(projectPath: string, id: string): boolean {
  return existsSync(reportPath(projectPath, id));
}

/**
 * Clean a case's raw gaze recording and write the master frame, the three views,
 * and the QA report under `.sight/cleaned/<id>/`. Returns the QA report.
 */
export async function runCleaning(
  projectPath: string,
  id: string,
  overrides?: CleaningConfigOverrides,
): Promise<QaReport> {
  const input = gazeFilePath(projectPath, id);
  if (!existsSync(input)) {
    throw new Error(`gaze file not found for case "${id}" at ${input}`);
  }
  const outDir = cleanedDir(projectPath, id);
  await mkdir(outDir, { recursive: true });

  const result = await cleanRecording(input, overrides ?? {}, id);
  await result.save(outDir);
  return result.report;
}

/** Read a previously written cleaning report, or null if none exists. */
export async function readCleaningReport(
  projectPath: string,
  id: string,
): Promise<QaReport | null> {
  const file = reportPath(projectPath, id);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, 'utf-8')) as QaReport;
  } catch (err) {
    console.error('[cleaningService] failed to read cleaning report', err);
    return null;
  }
}
