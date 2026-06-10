/**
 * Data-gap detection: runs of consecutive INVALID gaze frames at/above
 * `max_consecutive_invalid_for_gap` are labelled as gaps. Shorter INVALID
 * stretches are left unflagged here — individual frames are still caught by
 * `gaze_valid` — so only true gaps drive the `in_invalid_run` exclusion.
 */

import type { CleaningConfig } from '../config';
import { addBoolColumn, addNumColumn, getStr, type Table } from '../frame';
import { STATUS_VALID } from '../schema';

/**
 * Add `in_invalid_run` (0/1) and `invalid_run_id` (0-based id, NaN outside any
 * gap). A run is a maximal stretch of `gaze_status !== VALID`. Mutates and
 * returns `table`.
 */
export function flagInvalidRuns(table: Table, config: CleaningConfig): Table {
  const n = table.numRows;
  const status = getStr(table, 'gaze_status');
  const threshold = config.max_consecutive_invalid_for_gap;

  const inRun = new Uint8Array(n);
  const runId = new Float64Array(n).fill(NaN);

  let nextRunId = 0;
  let i = 0;
  while (i < n) {
    if (status[i] === STATUS_VALID) {
      i++;
      continue;
    }
    // Extent of this INVALID stretch: [start, end).
    let end = i + 1;
    while (end < n && status[end] !== STATUS_VALID) end++;
    if (end - i >= threshold) {
      for (let j = i; j < end; j++) {
        inRun[j] = 1;
        runId[j] = nextRunId;
      }
      nextRunId++;
    }
    i = end;
  }

  addBoolColumn(table, 'in_invalid_run', inRun);
  addNumColumn(table, 'invalid_run_id', runId);
  return table;
}
