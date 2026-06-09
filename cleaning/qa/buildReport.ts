/**
 * QA / provenance report: machine-readable stats plus a Markdown rendering.
 *
 * Summarizes everything the cleaning pass did — validity, gaps, sentinel
 * replacements, blinks, interpolation, exclusions — and echoes the exact config
 * used, so a recording's cleaning is fully reproducible from the report alone.
 */

import type { CleaningConfig } from '../config';
import { getBool, getNum, type Table } from '../frame';

export interface QaReport {
  recording_id: string;
  generated_at: string;
  total_frames: number;
  duration_s: number;
  inferred_sample_rate_hz: number;
  validity: {
    gaze_valid: number;
    gaze_valid_ratio: number;
    left_eye_valid: number;
    left_eye_valid_ratio: number;
    right_eye_valid: number;
    right_eye_valid_ratio: number;
  };
  invalid_runs: {
    count: number;
    total_frames: number;
    max_length: number;
    mean_length: number;
  };
  sentinel_replacements: {
    focus_distance_sentinel: number;
    focus_out_of_bounds: number;
    pupil_left_out_of_bounds: number;
    pupil_right_out_of_bounds: number;
  };
  blinks: { left: number; right: number };
  pupil_asymmetry_exceeded: number;
  focus_unstable: number;
  interpolation: {
    method: string;
    left_interpolated: number;
    right_interpolated: number;
    left_pct: number;
    right_pct: number;
  };
  excluded: number;
  excluded_pct: number;
  warnings: string[];
  status: 'pass' | 'warn';
  config: CleaningConfig;
}

export interface ReportMeta {
  recordingId: string;
}

function sum(flags: Uint8Array): number {
  let s = 0;
  for (let i = 0; i < flags.length; i++) s += flags[i];
  return s;
}

function ratio(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

/** Median of the finite values in `arr` (ignores NaN). 0 if none. */
function medianFinite(arr: Float64Array): number {
  const finite: number[] = [];
  for (let i = 0; i < arr.length; i++)
    if (Number.isFinite(arr[i])) finite.push(arr[i]);
  if (finite.length === 0) return 0;
  finite.sort((a, b) => a - b);
  const mid = finite.length >> 1;
  return finite.length % 2 === 0
    ? (finite[mid - 1] + finite[mid]) / 2
    : finite[mid];
}

/** Summarize the lengths of the flagged INVALID runs from invalid_run_id. */
function summarizeRuns(inRun: Uint8Array, runId: Float64Array) {
  const lengths = new Map<number, number>();
  for (let i = 0; i < inRun.length; i++) {
    if (inRun[i]) {
      const id = runId[i];
      lengths.set(id, (lengths.get(id) ?? 0) + 1);
    }
  }
  const values = [...lengths.values()];
  const total = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    total_frames: total,
    max_length: values.length ? Math.max(...values) : 0,
    mean_length: values.length ? total / values.length : 0,
  };
}

/**
 * Compute the QA report for a fully-cleaned master `table`.
 */
export function buildReport(
  table: Table,
  config: CleaningConfig,
  meta: ReportMeta,
): QaReport {
  const n = table.numRows;
  const timeS = getNum(table, 'time_s');
  const dtMs = getNum(table, 'sample_dt_ms');

  const gazeValid = sum(getBool(table, 'gaze_valid'));
  const leftValid = sum(getBool(table, 'left_eye_valid'));
  const rightValid = sum(getBool(table, 'right_eye_valid'));

  const runs = summarizeRuns(
    getBool(table, 'in_invalid_run'),
    getNum(table, 'invalid_run_id'),
  );

  const leftInterp = sum(getBool(table, 'interpolated_left_pupil'));
  const rightInterp = sum(getBool(table, 'interpolated_right_pupil'));
  const excluded = sum(getBool(table, 'excluded'));

  const medianDt = medianFinite(dtMs);
  const inferredHz = medianDt > 0 ? 1000 / medianDt : 0;

  const gazeValidRatio = ratio(gazeValid, n);
  const warnings: string[] = [];
  if (gazeValidRatio < config.min_valid_frame_ratio) {
    warnings.push(
      `overall valid-frame ratio ${(gazeValidRatio * 100).toFixed(1)}% is below the ` +
        `${(config.min_valid_frame_ratio * 100).toFixed(1)}% threshold`,
    );
  }

  return {
    recording_id: meta.recordingId,
    generated_at: new Date().toISOString(),
    total_frames: n,
    duration_s: n > 0 ? timeS[n - 1] : 0,
    inferred_sample_rate_hz: inferredHz,
    validity: {
      gaze_valid: gazeValid,
      gaze_valid_ratio: gazeValidRatio,
      left_eye_valid: leftValid,
      left_eye_valid_ratio: ratio(leftValid, n),
      right_eye_valid: rightValid,
      right_eye_valid_ratio: ratio(rightValid, n),
    },
    invalid_runs: runs,
    sentinel_replacements: {
      focus_distance_sentinel: sum(getBool(table, 'focus_distance_sentinel')),
      focus_out_of_bounds: sum(getBool(table, 'focus_out_of_bounds')),
      pupil_left_out_of_bounds: sum(getBool(table, 'pupil_left_out_of_bounds')),
      pupil_right_out_of_bounds: sum(
        getBool(table, 'pupil_right_out_of_bounds'),
      ),
    },
    blinks: {
      left: sum(getBool(table, 'blink_left')),
      right: sum(getBool(table, 'blink_right')),
    },
    pupil_asymmetry_exceeded: sum(getBool(table, 'pupil_asymmetry_exceeded')),
    focus_unstable: sum(getBool(table, 'focus_unstable')),
    interpolation: {
      method: config.pupil_interpolation_method,
      left_interpolated: leftInterp,
      right_interpolated: rightInterp,
      left_pct: ratio(leftInterp, n) * 100,
      right_pct: ratio(rightInterp, n) * 100,
    },
    excluded,
    excluded_pct: ratio(excluded, n) * 100,
    warnings,
    status: warnings.length > 0 ? 'warn' : 'pass',
    config,
  };
}

function pct(x: number): string {
  return `${x.toFixed(1)}%`;
}

/** Render a {@link QaReport} as human-readable Markdown. */
export function reportToMarkdown(report: QaReport): string {
  const v = report.validity;
  const r = report.invalid_runs;
  const s = report.sentinel_replacements;
  const lines = [
    `# Gaze Cleaning QA Report — ${report.recording_id}`,
    '',
    `- **Status:** ${report.status.toUpperCase()}`,
    `- **Generated:** ${report.generated_at}`,
    `- **Total frames:** ${report.total_frames}`,
    `- **Duration:** ${report.duration_s.toFixed(3)} s`,
    `- **Inferred sample rate:** ${report.inferred_sample_rate_hz.toFixed(1)} Hz`,
    '',
    '## Validity',
    '',
    '| Signal | Valid | Ratio |',
    '| --- | ---: | ---: |',
    `| Gaze | ${v.gaze_valid} | ${pct(v.gaze_valid_ratio * 100)} |`,
    `| Left eye | ${v.left_eye_valid} | ${pct(v.left_eye_valid_ratio * 100)} |`,
    `| Right eye | ${v.right_eye_valid} | ${pct(v.right_eye_valid_ratio * 100)} |`,
    '',
    '## Data gaps (INVALID runs)',
    '',
    `- **Count:** ${r.count}`,
    `- **Frames in gaps:** ${r.total_frames}`,
    `- **Longest gap:** ${r.max_length} frames`,
    `- **Mean gap length:** ${r.mean_length.toFixed(1)} frames`,
    '',
    '## Sentinel & out-of-bounds replacements',
    '',
    `- **Focus distance == 0 (sentinel):** ${s.focus_distance_sentinel}`,
    `- **Focus out of bounds:** ${s.focus_out_of_bounds}`,
    `- **Left pupil out of bounds:** ${s.pupil_left_out_of_bounds}`,
    `- **Right pupil out of bounds:** ${s.pupil_right_out_of_bounds}`,
    '',
    '## Blinks & quality flags',
    '',
    `- **Blinks (left / right):** ${report.blinks.left} / ${report.blinks.right}`,
    `- **L/R asymmetry exceeded:** ${report.pupil_asymmetry_exceeded}`,
    `- **Focus unstable:** ${report.focus_unstable}`,
    '',
    '## Interpolation',
    '',
    `- **Method:** ${report.interpolation.method}`,
    `- **Left interpolated:** ${report.interpolation.left_interpolated} (${pct(report.interpolation.left_pct)})`,
    `- **Right interpolated:** ${report.interpolation.right_interpolated} (${pct(report.interpolation.right_pct)})`,
    '',
    '## Exclusions',
    '',
    `- **Excluded under gate:** ${report.excluded} (${pct(report.excluded_pct)})`,
  ];

  if (report.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    for (const w of report.warnings) lines.push(`- ⚠️ ${w}`);
  }

  lines.push(
    '',
    '## Config used',
    '',
    '```json',
    JSON.stringify(report.config, null, 2),
    '```',
    '',
  );
  return lines.join('\n');
}
