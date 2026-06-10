/**
 * Derived signal columns: a rebased time axis and optional gaze angles.
 *
 * The nanosecond `capture_time` clock is rebased to start at 0 using BigInt math
 * (its ~1.0e18 ns magnitude loses precision as a float), then converted to
 * seconds/milliseconds. Inter-frame deltas feed downstream gap logic.
 */

import type { CleaningConfig } from '../config';
import { addNumColumn, getBigInt, getNum, type Table } from '../frame';

const RAD_TO_DEG = 180 / Math.PI;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Add `time_s`, `time_ms`, and `sample_dt_ms` (and, when enabled,
 * `gaze_azimuth_deg` / `gaze_elevation_deg`). Mutates and returns `table`.
 */
export function deriveColumns(table: Table, config: CleaningConfig): Table {
  const n = table.numRows;
  const capture = getBigInt(table, 'capture_time');

  const timeS = new Float64Array(n);
  const timeMs = new Float64Array(n);
  const dtMs = new Float64Array(n);

  const base = n > 0 ? capture[0] : 0n;
  for (let i = 0; i < n; i++) {
    const ns = Number(capture[i] - base);
    timeS[i] = ns / 1e9;
    timeMs[i] = ns / 1e6;
    dtMs[i] = i === 0 ? NaN : timeMs[i] - timeMs[i - 1];
  }

  addNumColumn(table, 'time_s', timeS);
  addNumColumn(table, 'time_ms', timeMs);
  addNumColumn(table, 'sample_dt_ms', dtMs);

  if (config.derive_gaze_angles) {
    const fx = getNum(table, 'combined_gaze_forward_x');
    const fy = getNum(table, 'combined_gaze_forward_y');
    const fz = getNum(table, 'combined_gaze_forward_z');
    const azimuth = new Float64Array(n);
    const elevation = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      // NaN forward components (INVALID frames) propagate naturally to NaN angles.
      azimuth[i] = Math.atan2(fx[i], fz[i]) * RAD_TO_DEG;
      elevation[i] = Math.asin(clamp(fy[i], -1, 1)) * RAD_TO_DEG;
    }
    addNumColumn(table, 'gaze_azimuth_deg', azimuth);
    addNumColumn(table, 'gaze_elevation_deg', elevation);
  }

  return table;
}
