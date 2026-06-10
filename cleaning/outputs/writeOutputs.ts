/**
 * Serialize a {@link CleanResult} to disk: the master cleaned frame and the
 * three per-module views as CSV, plus the QA report as JSON and Markdown. File
 * names are prefixed with the recording id so multiple recordings can share an
 * output directory.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { toCsv } from '../frame';
import type { CleanResult } from '../pipeline/cleanRecording';
import { reportToMarkdown } from '../qa/buildReport';

export interface WrittenOutputs {
  master: string;
  saccade: string;
  pupillometry: string;
  gazeQuality: string;
  reportJson: string;
  reportMarkdown: string;
}

/** Write all cleaning artifacts for `result` into `outDir`, creating it if needed. */
export async function writeOutputs(
  result: CleanResult,
  outDir: string,
): Promise<WrittenOutputs> {
  await mkdir(outDir, { recursive: true });
  const id = result.report.recording_id;

  const files: WrittenOutputs = {
    master: path.join(outDir, `${id}.cleaned.csv`),
    saccade: path.join(outDir, `${id}.saccade.csv`),
    pupillometry: path.join(outDir, `${id}.pupillometry.csv`),
    gazeQuality: path.join(outDir, `${id}.gaze_quality.csv`),
    reportJson: path.join(outDir, `${id}.qa.json`),
    reportMarkdown: path.join(outDir, `${id}.qa.md`),
  };

  await Promise.all([
    writeFile(files.master, toCsv(result.frame), 'utf-8'),
    writeFile(files.saccade, toCsv(result.saccadeView), 'utf-8'),
    writeFile(files.pupillometry, toCsv(result.pupillometryView), 'utf-8'),
    writeFile(files.gazeQuality, toCsv(result.gazeQualityView), 'utf-8'),
    writeFile(
      files.reportJson,
      JSON.stringify(result.report, null, 2),
      'utf-8',
    ),
    writeFile(files.reportMarkdown, reportToMarkdown(result.report), 'utf-8'),
  ]);

  return files;
}
