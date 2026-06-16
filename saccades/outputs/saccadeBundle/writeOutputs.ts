/**
 * Serialize a saccade-analysis result to disk: the per-frame series and the
 * per-saccade table as CSV, plus the summary report as JSON. File names are
 * prefixed with the recording id, mirroring the cleaning stage's `writeOutputs`.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { SaccadeResult } from '@saccades/pipeline/runSaccadeAnalysis';

import { framesToCsv, saccadesToCsv } from './serializers';

export interface WrittenSaccadeOutputs {
  frames: string;
  saccades: string;
  reportJson: string;
}

/** Write all saccade artifacts for `result` into `outDir`, creating it if needed. */
export async function writeSaccadeOutputs(
  result: SaccadeResult,
  outDir: string,
): Promise<WrittenSaccadeOutputs> {
  await mkdir(outDir, { recursive: true });
  const id = result.report.recording_id;

  const files: WrittenSaccadeOutputs = {
    frames: path.join(outDir, `${id}.frames.csv`),
    saccades: path.join(outDir, `${id}.saccades.csv`),
    reportJson: path.join(outDir, `${id}.saccade.json`),
  };

  await Promise.all([
    writeFile(files.frames, framesToCsv(result.frames), 'utf-8'),
    writeFile(files.saccades, saccadesToCsv(result.saccades), 'utf-8'),
    writeFile(
      files.reportJson,
      JSON.stringify(result.report, null, 2),
      'utf-8',
    ),
  ]);

  return files;
}
