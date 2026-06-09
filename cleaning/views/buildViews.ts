/**
 * The three downstream per-module views — exact column subsets of the master
 * cleaned frame (spec §5b). Views share the master's underlying typed arrays
 * (zero copy); they are just ordered column selections.
 */

import type { CleaningConfig } from '../config';
import { selectColumns, type Table } from '../frame';
import {
  GAZE_QUALITY_VIEW_COLUMNS,
  PUPILLOMETRY_VIEW_COLUMNS,
  SACCADE_VIEW_ANGLE_COLUMNS,
  SACCADE_VIEW_COLUMNS,
} from '../schema';

export interface CleanViews {
  saccade: Table;
  pupillometry: Table;
  gazeQuality: Table;
}

/**
 * Build the saccade, pupillometry, and gaze-quality views from a fully-cleaned
 * master `table`. The saccade view gains the derived gaze-angle columns when
 * `derive_gaze_angles` is enabled. Throws if any expected column is missing,
 * which guards against the pipeline skipping a step.
 */
export function buildViews(table: Table, config: CleaningConfig): CleanViews {
  const saccadeCols = config.derive_gaze_angles
    ? [...SACCADE_VIEW_COLUMNS, ...SACCADE_VIEW_ANGLE_COLUMNS]
    : [...SACCADE_VIEW_COLUMNS];

  return {
    saccade: selectColumns(table, saccadeCols),
    pupillometry: selectColumns(table, PUPILLOMETRY_VIEW_COLUMNS),
    gazeQuality: selectColumns(table, GAZE_QUALITY_VIEW_COLUMNS),
  };
}
