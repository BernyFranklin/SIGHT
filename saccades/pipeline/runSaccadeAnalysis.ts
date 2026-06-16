/**
 * The saccade-analysis pipeline: cleaned saccade-view CSV → per-frame series
 * (trajectory + velocity), per-saccade table, and a summary report. Mirrors the
 * cleaning stage's `cleanRecording` shape (a result object carrying a
 * `save(outDir)` that serializes the bundle).
 *
 * Time base: detection runs on the contiguous stream of *selected valid* frames
 * at a fixed dt = 1/rate, so `timeS` here is "valid-sample time" (index/rate),
 * shared by the frame series and the per-saccade times — markers line up with
 * the trajectory. Original recording frame numbers are kept for provenance.
 * (Wall-clock alignment via per-frame `sample_dt_ms` is a later refinement.)
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { detectSaccadesFromVectors } from '@saccades/core/detection';
import {
  DEFAULT_SACCADE_OPTIONS,
  DEFAULT_SAMPLING_RATE_HZ,
  type SaccadeDetectionOptions,
} from '@saccades/core/schema';
import { parseSaccadeView } from '@saccades/ingest/parseSaccadeView';
import { writeSaccadeOutputs } from '@saccades/outputs/saccadeBundle/writeOutputs';
import type { WrittenSaccadeOutputs } from '@saccades/outputs/saccadeBundle/writeOutputs';
import { buildSaccadeReport, type SaccadeReport } from '@saccades/report';

/** One row of the per-frame series (drives the trajectory + velocity visuals). */
export interface SaccadeFrame {
  /** Original recording frame number. */
  frame: number;
  /** Valid-sample time (index / rate), in seconds. */
  timeS: number;
  gazeForwardX: number;
  gazeForwardY: number;
  velocityDegPerSec: number;
  inSaccade: boolean;
}

/** One detected saccade (drives the main-sequence scatter + amplitude histogram). */
export interface PerSaccadeRow {
  index: number;
  startFrame: number;
  endFrame: number;
  startTimeS: number;
  endTimeS: number;
  durationMs: number;
  amplitudeDeg: number;
  peakVelocityDegPerSec: number;
  meanVelocityDegPerSec: number;
}

export interface SaccadeResult {
  frames: SaccadeFrame[];
  saccades: PerSaccadeRow[];
  report: SaccadeReport;
  /** Serialize the frame series, per-saccade table, and report into `outDir`. */
  save(outDir: string): Promise<WrittenSaccadeOutputs>;
}

export interface SaccadeAnalysisOptions {
  /** Sampling rate (Hz); pass the cleaning-inferred rate. Falls back to default. */
  samplingRateHz?: number;
  recordingId?: string;
  /** Detection-threshold overrides; `samplingRate` is always taken from the rate above. */
  detection?: Partial<Omit<SaccadeDetectionOptions, 'samplingRate'>>;
}

/** Run saccade analysis over already-loaded cleaned saccade-view CSV text. */
export function runSaccadeAnalysisText(
  csvText: string,
  options: SaccadeAnalysisOptions = {},
): SaccadeResult {
  const ingest = parseSaccadeView(csvText);

  const rate =
    Number.isFinite(options.samplingRateHz) && (options.samplingRateHz ?? 0) > 0
      ? (options.samplingRateHz as number)
      : DEFAULT_SAMPLING_RATE_HZ;

  const detection: SaccadeDetectionOptions = {
    ...DEFAULT_SACCADE_OPTIONS,
    ...options.detection,
    samplingRate: rate,
  };

  const detected = detectSaccadesFromVectors(ingest.vectors, detection);

  // Mark which selected samples fall inside a detected saccade interval.
  const inSaccade = new Uint8Array(ingest.vectors.length);
  for (const s of detected.saccades) {
    for (let i = s.startIndex; i <= s.endIndex; i++) inSaccade[i] = 1;
  }

  const frames: SaccadeFrame[] = ingest.vectors.map((v, i) => ({
    frame: ingest.frames[i],
    timeS: i / rate,
    gazeForwardX: v.x,
    gazeForwardY: v.y,
    velocityDegPerSec: detected.velocitiesDegPerSec[i] ?? 0,
    inSaccade: inSaccade[i] === 1,
  }));

  const saccades: PerSaccadeRow[] = detected.saccades.map((s, i) => ({
    index: i,
    startFrame: ingest.frames[s.startIndex],
    endFrame: ingest.frames[s.endIndex],
    startTimeS: s.startTimeSec,
    endTimeS: s.endTimeSec,
    durationMs: s.durationMs,
    amplitudeDeg: s.amplitudeDeg,
    peakVelocityDegPerSec: s.peakVelocityDegPerSec,
    meanVelocityDegPerSec: s.meanVelocityDegPerSec,
  }));

  const report = buildSaccadeReport(detected.saccades, {
    recordingId: options.recordingId ?? 'recording',
    samplingRateHz: rate,
    detection,
    diagnostics: ingest.diagnostics,
  });

  const result: SaccadeResult = {
    frames,
    saccades,
    report,
    save: (outDir: string) => writeSaccadeOutputs(result, outDir),
  };
  return result;
}

/**
 * Read and analyze a cleaned saccade-view CSV file. The recording id defaults to
 * the file's base name (sans extension) and is stamped into the report/outputs.
 */
export async function runSaccadeAnalysis(
  filePath: string,
  options: SaccadeAnalysisOptions = {},
): Promise<SaccadeResult> {
  const text = await readFile(filePath, 'utf-8');
  const recordingId =
    options.recordingId ?? path.basename(filePath, path.extname(filePath));
  return runSaccadeAnalysisText(text, { ...options, recordingId });
}
