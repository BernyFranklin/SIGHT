/**
 * The cleaning pipeline: raw CSV → master cleaned frame + three views + QA
 * report. Each stage mutates a single columnar table in place (vectorized,
 * large-file friendly); nothing is dropped — every exclusion is a flag.
 */

import path from 'node:path';

import {
  type CleaningConfig,
  type CleaningConfigOverrides,
  resolveConfig,
} from '../config';
import { deriveColumns } from '../core/deriveColumns';
import { flagExcluded } from '../core/excluded';
import { computeFlags } from '../core/flags';
import { interpolatePupils } from '../core/interpolate';
import { flagInvalidRuns } from '../core/invalidRuns';
import { type Table } from '../frame';
import { parseVarjoCsv, readVarjoCsv } from '../ingest/parseVarjoCsv';
import { writeOutputs, type WrittenOutputs } from '../outputs/writeOutputs';
import { buildReport, type QaReport } from '../qa/buildReport';
import { buildViews } from '../views/buildViews';

export interface CleanResult {
  /** Master cleaned frame: all signals, derived columns, and provenance flags. */
  frame: Table;
  saccadeView: Table;
  pupillometryView: Table;
  gazeQualityView: Table;
  report: QaReport;
  /** Serialize the master frame, views, and QA report into `outDir`. */
  save(outDir: string): Promise<WrittenOutputs>;
}

/** Run every cleaning stage over an already-parsed raw table. */
export function cleanTable(
  table: Table,
  config: CleaningConfig,
  recordingId: string,
): CleanResult {
  deriveColumns(table, config); // time axis + optional angles
  flagInvalidRuns(table, config); // data gaps
  computeFlags(table, config); // validity/blink/pupil/focus + sentinel→NaN
  interpolatePupils(table, config); // optional short-gap fill (after nulling)
  flagExcluded(table, config); // rolled-up inclusion gate

  const views = buildViews(table, config);
  const report = buildReport(table, config, { recordingId });

  const result: CleanResult = {
    frame: table,
    saccadeView: views.saccade,
    pupillometryView: views.pupillometry,
    gazeQualityView: views.gazeQuality,
    report,
    save: (outDir: string) => writeOutputs(result, outDir),
  };
  return result;
}

/** Clean raw Varjo CSV text. `config` may be a resolved config or partial overrides. */
export function cleanRecordingText(
  text: string,
  config: CleaningConfig | CleaningConfigOverrides = {},
  recordingId = 'recording',
): CleanResult {
  return cleanTable(parseVarjoCsv(text), resolveConfig(config), recordingId);
}

/**
 * Read and clean a raw Varjo CSV file. The recording id defaults to the file's
 * base name (sans extension) and is stamped into the QA report and output files.
 */
export async function cleanRecording(
  filePath: string,
  config: CleaningConfig | CleaningConfigOverrides = {},
  recordingId = path.basename(filePath, path.extname(filePath)),
): Promise<CleanResult> {
  const table = await readVarjoCsv(filePath);
  return cleanTable(table, resolveConfig(config), recordingId);
}
