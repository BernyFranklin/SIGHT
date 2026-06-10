/**
 * Optional, config-gated interpolation of short pupil-diameter gaps.
 *
 * Conservative by design: only gaps shorter than `pupil_blink_max_gap_ms` and
 * bracketed by valid samples on both sides are filled; longer gaps and
 * edge-anchored runs stay NaN. Every filled sample is recorded in an
 * `interpolated_*` flag so nothing is silently fabricated.
 */

import type { CleaningConfig, PupilInterpolationMethod } from '../config';
import { addBoolColumn, getNum, type Table } from '../frame';

/** Time-parameterized linear value between two anchors. */
function linearAt(
  t: number,
  t1: number,
  p1: number,
  t2: number,
  p2: number,
): number {
  return p1 + (p2 - p1) * ((t - t1) / (t2 - t1));
}

/**
 * Fill NaN runs in `values` in place, returning a per-row interpolated flag.
 * `cubic_spline` uses a time-parameterized cubic Hermite (Catmull-Rom) with the
 * nearest valid neighbour on each side for its tangents, falling back to the
 * secant slope (i.e. linear) at series edges or adjacent gaps.
 */
function fillGaps(
  values: Float64Array,
  timeMs: Float64Array,
  maxGapMs: number,
  method: PupilInterpolationMethod,
): Uint8Array {
  const n = values.length;
  const flags = new Uint8Array(n);
  if (method === 'none') return flags;

  let i = 0;
  while (i < n) {
    if (!Number.isNaN(values[i])) {
      i++;
      continue;
    }
    const start = i;
    let end = start + 1;
    while (end < n && Number.isNaN(values[end])) end++;

    const prev = start - 1;
    const next = end;
    // Need a valid anchor on both sides; edge-anchored gaps stay NaN.
    if (prev >= 0 && next < n && timeMs[next] - timeMs[prev] < maxGapMs) {
      fillRun(values, timeMs, flags, start, end, prev, next, method);
    }
    i = end;
  }
  return flags;
}

function fillRun(
  values: Float64Array,
  timeMs: Float64Array,
  flags: Uint8Array,
  start: number,
  end: number,
  prev: number,
  next: number,
  method: PupilInterpolationMethod,
): void {
  const n = values.length;
  const t1 = timeMs[prev];
  const t2 = timeMs[next];
  const p1 = values[prev];
  const p2 = values[next];
  const secant = (p2 - p1) / (t2 - t1);

  let cubic = false;
  let m1 = secant;
  let m2 = secant;
  if (method === 'cubic_spline') {
    cubic = true;
    const haveP0 = prev - 1 >= 0 && !Number.isNaN(values[prev - 1]);
    const haveP3 = next + 1 < n && !Number.isNaN(values[next + 1]);
    if (haveP0) m1 = (p2 - values[prev - 1]) / (t2 - timeMs[prev - 1]);
    if (haveP3) m2 = (values[next + 1] - p1) / (timeMs[next + 1] - t1);
  }

  const h = t2 - t1;
  for (let k = start; k < end; k++) {
    const t = timeMs[k];
    if (cubic) {
      const s = (t - t1) / h;
      const s2 = s * s;
      const s3 = s2 * s;
      const h00 = 2 * s3 - 3 * s2 + 1;
      const h10 = s3 - 2 * s2 + s;
      const h01 = -2 * s3 + 3 * s2;
      const h11 = s3 - s2;
      values[k] = h00 * p1 + h10 * h * m1 + h01 * p2 + h11 * h * m2;
    } else {
      values[k] = linearAt(t, t1, p1, t2, p2);
    }
    flags[k] = 1;
  }
}

/**
 * Interpolate short gaps in both pupil-diameter columns. Always adds
 * `interpolated_left_pupil` / `interpolated_right_pupil` (all-zero when the
 * method is `none`) so the pupillometry view's columns are stable. Requires
 * `time_ms` (from {@link deriveColumns}). Mutates and returns `table`.
 */
export function interpolatePupils(table: Table, config: CleaningConfig): Table {
  const timeMs = getNum(table, 'time_ms');
  const method = config.pupil_interpolation_method;
  const maxGap = config.pupil_blink_max_gap_ms;

  const leftFlags = fillGaps(
    getNum(table, 'left_pupil_diameter_mm'),
    timeMs,
    maxGap,
    method,
  );
  const rightFlags = fillGaps(
    getNum(table, 'right_pupil_diameter_mm'),
    timeMs,
    maxGap,
    method,
  );

  addBoolColumn(table, 'interpolated_left_pupil', leftFlags);
  addBoolColumn(table, 'interpolated_right_pupil', rightFlags);
  return table;
}
