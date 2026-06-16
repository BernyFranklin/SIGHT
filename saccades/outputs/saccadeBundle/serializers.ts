/**
 * CSV serializers for the saccade output bundle. Column names are snake_case to
 * match the cleaning stage's CSV conventions; NaN renders as an empty cell.
 */

import type {
  PerSaccadeRow,
  SaccadeFrame,
} from '@saccades/pipeline/runSaccadeAnalysis';

const FRAME_COLUMNS = [
  'frame',
  'time_s',
  'gaze_forward_x',
  'gaze_forward_y',
  'velocity_deg_s',
  'in_saccade',
] as const;

const SACCADE_COLUMNS = [
  'index',
  'start_frame',
  'end_frame',
  'start_time_s',
  'end_time_s',
  'duration_ms',
  'amplitude_deg',
  'peak_velocity_deg_s',
  'mean_velocity_deg_s',
] as const;

function num(v: number): string {
  return Number.isNaN(v) ? '' : String(v);
}

/** Per-frame trajectory + velocity series → CSV (header + rows, `\n` endings). */
export function framesToCsv(frames: SaccadeFrame[]): string {
  const lines: string[] = [FRAME_COLUMNS.join(',')];
  for (const f of frames) {
    lines.push(
      [
        num(f.frame),
        num(f.timeS),
        num(f.gazeForwardX),
        num(f.gazeForwardY),
        num(f.velocityDegPerSec),
        f.inSaccade ? 'true' : 'false',
      ].join(','),
    );
  }
  return lines.join('\n');
}

/** Per-saccade table → CSV (header + rows, `\n` endings). */
export function saccadesToCsv(saccades: PerSaccadeRow[]): string {
  const lines: string[] = [SACCADE_COLUMNS.join(',')];
  for (const s of saccades) {
    lines.push(
      [
        num(s.index),
        num(s.startFrame),
        num(s.endFrame),
        num(s.startTimeS),
        num(s.endTimeS),
        num(s.durationMs),
        num(s.amplitudeDeg),
        num(s.peakVelocityDegPerSec),
        num(s.meanVelocityDegPerSec),
      ].join(','),
    );
  }
  return lines.join('\n');
}
