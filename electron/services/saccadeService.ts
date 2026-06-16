import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { QaReport } from '@cleaning';
import { runSaccadeAnalysis as analyzeSaccadeCsv } from '@saccades';
import type { SaccadeReport } from '@saccades';

/**
 * Bridges the saccade-analysis library to a project's on-disk layout. Saccade
 * analysis consumes the cleaned saccade view produced by the cleaning stage at
 * `<project>/.sight/cleaned/<id>/<id>.saccade.csv`; its artifacts are written
 * under `<project>/.sight/saccades/<id>/`. A case must be cleaned first.
 *
 * NOTE: like cleaning, this runs synchronously on the main process. If large
 * recordings cause UI jank, move {@link runSaccadeAnalysis} into a worker.
 */

const SIGHT_DIR = '.sight';
const CLEANED_DIR = 'cleaned';
const SACCADES_DIR = 'saccades';

function cleanedDir(projectPath: string, id: string): string {
  return path.join(projectPath, SIGHT_DIR, CLEANED_DIR, id);
}

function saccadeViewPath(projectPath: string, id: string): string {
  return path.join(cleanedDir(projectPath, id), `${id}.saccade.csv`);
}

function cleaningReportPath(projectPath: string, id: string): string {
  return path.join(cleanedDir(projectPath, id), `${id}.qa.json`);
}

function saccadesDir(projectPath: string, id: string): string {
  return path.join(projectPath, SIGHT_DIR, SACCADES_DIR, id);
}

function reportPath(projectPath: string, id: string): string {
  return path.join(saccadesDir(projectPath, id), `${id}.saccade.json`);
}

/** Whether a saccade report already exists for this case. */
export function hasSaccadeReport(projectPath: string, id: string): boolean {
  return existsSync(reportPath(projectPath, id));
}

/** Read the cleaning-inferred sample rate from the case's QA report, if present. */
async function readInferredSampleRate(
  projectPath: string,
  id: string,
): Promise<number | undefined> {
  const file = cleaningReportPath(projectPath, id);
  if (!existsSync(file)) return undefined;
  try {
    const qa = JSON.parse(await readFile(file, 'utf-8')) as QaReport;
    return qa.inferred_sample_rate_hz;
  } catch (err) {
    console.error('[saccadeService] failed to read cleaning report', err);
    return undefined;
  }
}

/**
 * Run saccade analysis over a case's cleaned saccade view and write the frame
 * series, per-saccade table, and summary report under `.sight/saccades/<id>/`.
 * Returns the summary report. Throws if the case has not been cleaned yet.
 */
export async function runSaccadeAnalysis(
  projectPath: string,
  id: string,
): Promise<SaccadeReport> {
  const input = saccadeViewPath(projectPath, id);
  if (!existsSync(input)) {
    throw new Error(
      `case "${id}" has not been cleaned yet — clean its gaze data before running saccade analysis`,
    );
  }

  const samplingRateHz = await readInferredSampleRate(projectPath, id);
  const outDir = saccadesDir(projectPath, id);
  await mkdir(outDir, { recursive: true });

  const result = await analyzeSaccadeCsv(input, {
    samplingRateHz,
    recordingId: id,
  });
  await result.save(outDir);
  return result.report;
}

/** Read a previously written saccade report, or null if none exists. */
export async function readSaccadeReport(
  projectPath: string,
  id: string,
): Promise<SaccadeReport | null> {
  const file = reportPath(projectPath, id);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, 'utf-8')) as SaccadeReport;
  } catch (err) {
    console.error('[saccadeService] failed to read saccade report', err);
    return null;
  }
}
