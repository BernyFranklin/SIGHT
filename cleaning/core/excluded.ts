/**
 * Rolls the configured inclusion gate up into a single `excluded` flag. The gate
 * is data-driven (see {@link InclusionGateConfig}) so each downstream module can
 * request a different inclusion rule without re-running the cleaning pipeline.
 */

import type { CleaningConfig } from '../config';
import { addBoolColumn, getBool, type Table } from '../frame';

/**
 * Add the `excluded` column from the configured gate. Requires the flag columns
 * from {@link computeFlags} and {@link flagInvalidRuns} to already be present.
 * Mutates and returns `table`.
 */
export function flagExcluded(table: Table, config: CleaningConfig): Table {
  const n = table.numRows;
  const gate = config.inclusion_gate;

  const gazeValid = getBool(table, 'gaze_valid');
  const inInvalidRun = getBool(table, 'in_invalid_run');
  const blinkLeft = getBool(table, 'blink_left');
  const blinkRight = getBool(table, 'blink_right');
  const pupilLeftOob = getBool(table, 'pupil_left_out_of_bounds');
  const pupilRightOob = getBool(table, 'pupil_right_out_of_bounds');
  const asymmetry = getBool(table, 'pupil_asymmetry_exceeded');
  const focusSentinel = getBool(table, 'focus_distance_sentinel');
  const focusOob = getBool(table, 'focus_out_of_bounds');

  const excluded = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let drop = false;
    if (gate.exclude_invalid_gaze && !gazeValid[i]) drop = true;
    else if (gate.exclude_invalid_runs && inInvalidRun[i]) drop = true;
    else if (gate.exclude_blinks && (blinkLeft[i] || blinkRight[i]))
      drop = true;
    else if (
      gate.exclude_pupil_out_of_bounds &&
      (pupilLeftOob[i] || pupilRightOob[i])
    )
      drop = true;
    else if (gate.exclude_asymmetry && asymmetry[i]) drop = true;
    else if (
      gate.exclude_focus_out_of_bounds &&
      (focusSentinel[i] || focusOob[i])
    )
      drop = true;
    excluded[i] = drop ? 1 : 0;
  }

  addBoolColumn(table, 'excluded', excluded);
  return table;
}
