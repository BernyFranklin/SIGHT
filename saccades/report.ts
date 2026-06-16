/**
 * Saccade-analysis summary report: machine-readable headline numbers plus the
 * exact detection options used, mirroring the cleaning stage's `QaReport` shape
 * so the case-level UI can render it with the same status/metric idiom.
 */

import type {
  SaccadeDetectionOptions,
  SaccadeEvent,
} from '@saccades/core/schema';
import type { SaccadeIngestDiagnostics } from '@saccades/ingest/parseSaccadeView';
import {
  computeDistributionStats,
  type DistributionStats,
} from '@saccades/metrics/stats';

export interface SaccadeReport {
  recording_id: string;
  generated_at: string;
  /** Sampling rate the detector ran at (Hz); fixed dt = 1/rate. */
  sampling_rate_hz: number;
  detection: SaccadeDetectionOptions;
  /** Rows in the cleaned saccade view. */
  total_frames: number;
  /** Selected valid frames fed to the detector. */
  analyzed_frames: number;
  excluded_frames: number;
  saccade_count: number;
  amplitude_deg: DistributionStats;
  peak_velocity_deg_s: DistributionStats;
  duration_ms: DistributionStats;
  warnings: string[];
  status: 'ok' | 'warn';
}

export interface SaccadeReportMeta {
  recordingId: string;
  samplingRateHz: number;
  detection: SaccadeDetectionOptions;
  diagnostics: SaccadeIngestDiagnostics;
}

/** Build the summary report from the detected saccades and ingest diagnostics. */
export function buildSaccadeReport(
  saccades: SaccadeEvent[],
  meta: SaccadeReportMeta,
): SaccadeReport {
  const { diagnostics } = meta;
  const warnings: string[] = [];

  if (diagnostics.selectedRows < 2) {
    warnings.push(
      `only ${diagnostics.selectedRows} analyzable frame(s) after excluding ` +
        `invalid/gap samples — not enough to detect saccades`,
    );
  } else if (saccades.length === 0) {
    warnings.push('no saccades detected above the velocity threshold');
  }

  return {
    recording_id: meta.recordingId,
    generated_at: new Date().toISOString(),
    sampling_rate_hz: meta.samplingRateHz,
    detection: meta.detection,
    total_frames: diagnostics.totalRows,
    analyzed_frames: diagnostics.selectedRows,
    excluded_frames: diagnostics.totalRows - diagnostics.selectedRows,
    saccade_count: saccades.length,
    amplitude_deg: computeDistributionStats(
      saccades.map((s) => s.amplitudeDeg),
    ),
    peak_velocity_deg_s: computeDistributionStats(
      saccades.map((s) => s.peakVelocityDegPerSec),
    ),
    duration_ms: computeDistributionStats(saccades.map((s) => s.durationMs)),
    warnings,
    status: warnings.length > 0 ? 'warn' : 'ok',
  };
}
