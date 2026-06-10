/**
 * Schema for the raw Varjo XR4 gaze export.
 *
 * The raw CSV has 42 header columns, but several are stored as parenthesized
 * tuples (e.g. `(0.033, -0.007, 0.999)`) whose internal commas are NOT field
 * separators. So a data row is really 25 comma-delimited *tokens* — some scalar,
 * some tuples — that expand to the 42 flat columns. This module is the single
 * source of truth for both layouts and for the clean snake_case names used
 * everywhere downstream.
 */

/** Column value kinds carried through the pipeline. */
export type ScalarType = 'num' | 'bigint' | 'str';

/** One comma-delimited token in a raw data row (scalar = 1 col, tuple = N cols). */
export interface RawToken {
  /** Output (snake_case) column names this token expands into. */
  readonly outs: readonly string[];
  /** Parsed type for each produced column. */
  readonly type: ScalarType;
}

/**
 * Exact raw header names, in order, as written by the Varjo exporter.
 * Note the two oddly-cased openness columns: `left Eye Openness` (lowercase,
 * space) and `Right Eye Openness` (capitalized, space). Preserved verbatim so
 * header validation can fail loudly on any drift.
 */
export const SOURCE_COLUMNS = [
  'Frame',
  'CaptureTime',
  'LogTime',
  'HMDPositionX',
  'HMDPositionY',
  'HMDPositionz',
  'HMDRotationX',
  'HMDRotationY',
  'HMDRotationZ',
  'HMDRotationHuh',
  'GazeStatus',
  'CombinedGazeForwardX',
  'CombinedGazeForwardY',
  'CombinedGazeForwardZ',
  'CombinedGazePositionX',
  'CombinedGazePositionY',
  'CombinedGazePositionZ',
  'InterPupillaryDistanceInMM',
  'LeftEyeStatus',
  'LeftEyeForwardX',
  'LeftEyeForwardY',
  'LeftEyeForwardZ',
  'LeftEyePositionX',
  'LeftEyePositionY',
  'LeftEyePositionZ',
  'LeftPupilIrisDiameterRatio',
  'LeftPupilDiameterInMM',
  'LeftIrisDiameterInMM',
  'left Eye Openness',
  'RightEyeStatus',
  'RightEyeForwardX',
  'RightEyeForwardY',
  'RightEyeForwardZ',
  'RightEyePositionX',
  'RightEyePositionY',
  'RightEyePositionZ',
  'RightPupilIrisDiameterRatio',
  'RightPupilDiameterInMM',
  'RightIrisDiameterInMM',
  'Right Eye Openness',
  'FocusDistance',
  'FocusStability',
] as const;

/**
 * Raw token layout of a data row, in order. The flattened `outs` of every token
 * must line up 1:1 with {@link SOURCE_COLUMNS}; {@link assertSchemaIntegrity}
 * enforces this. `capture_time` is parsed as bigint — its ~1.0e18 ns values
 * exceed Number.MAX_SAFE_INTEGER and would lose precision as a float.
 */
export const RAW_LAYOUT: readonly RawToken[] = [
  { outs: ['frame'], type: 'num' },
  { outs: ['capture_time'], type: 'bigint' },
  { outs: ['log_time'], type: 'num' },
  { outs: ['hmd_position_x', 'hmd_position_y', 'hmd_position_z'], type: 'num' },
  {
    outs: [
      'hmd_rotation_x',
      'hmd_rotation_y',
      'hmd_rotation_z',
      'hmd_rotation_w',
    ],
    type: 'num',
  },
  { outs: ['gaze_status'], type: 'str' },
  {
    outs: [
      'combined_gaze_forward_x',
      'combined_gaze_forward_y',
      'combined_gaze_forward_z',
    ],
    type: 'num',
  },
  {
    outs: [
      'combined_gaze_position_x',
      'combined_gaze_position_y',
      'combined_gaze_position_z',
    ],
    type: 'num',
  },
  { outs: ['inter_pupillary_distance_mm'], type: 'num' },
  { outs: ['left_eye_status'], type: 'str' },
  {
    outs: ['left_eye_forward_x', 'left_eye_forward_y', 'left_eye_forward_z'],
    type: 'num',
  },
  {
    outs: ['left_eye_position_x', 'left_eye_position_y', 'left_eye_position_z'],
    type: 'num',
  },
  { outs: ['left_pupil_iris_ratio'], type: 'num' },
  { outs: ['left_pupil_diameter_mm'], type: 'num' },
  { outs: ['left_iris_diameter_mm'], type: 'num' },
  { outs: ['left_eye_openness'], type: 'num' },
  { outs: ['right_eye_status'], type: 'str' },
  {
    outs: ['right_eye_forward_x', 'right_eye_forward_y', 'right_eye_forward_z'],
    type: 'num',
  },
  {
    outs: [
      'right_eye_position_x',
      'right_eye_position_y',
      'right_eye_position_z',
    ],
    type: 'num',
  },
  { outs: ['right_pupil_iris_ratio'], type: 'num' },
  { outs: ['right_pupil_diameter_mm'], type: 'num' },
  { outs: ['right_iris_diameter_mm'], type: 'num' },
  { outs: ['right_eye_openness'], type: 'num' },
  { outs: ['focus_distance'], type: 'num' },
  { outs: ['focus_stability'], type: 'num' },
] as const;

/** All 42 flat output column names (snake_case), in source order. */
export const FLAT_COLUMNS: readonly string[] = RAW_LAYOUT.flatMap(
  (t) => t.outs,
);

/** snake_case names of the three VALID/INVALID status columns. */
export const STATUS_COLUMNS = [
  'gaze_status',
  'left_eye_status',
  'right_eye_status',
] as const;

/** The literal a status column holds when tracking succeeded. */
export const STATUS_VALID = 'VALID';

/**
 * Column sets for the three downstream per-module views (spec §5b). Derived and
 * flag columns are appended by the cleaning pipeline; the optional gaze-angle
 * columns are appended to the saccade view only when angle derivation is enabled.
 */
export const SACCADE_VIEW_COLUMNS = [
  'frame',
  'time_s',
  'gaze_status',
  'combined_gaze_forward_x',
  'combined_gaze_forward_y',
  'combined_gaze_forward_z',
  'gaze_valid',
  'in_invalid_run',
  'sample_dt_ms',
] as const;

export const SACCADE_VIEW_ANGLE_COLUMNS = [
  'gaze_azimuth_deg',
  'gaze_elevation_deg',
] as const;

export const PUPILLOMETRY_VIEW_COLUMNS = [
  'frame',
  'time_s',
  'left_pupil_diameter_mm',
  'right_pupil_diameter_mm',
  'left_pupil_iris_ratio',
  'right_pupil_iris_ratio',
  'gaze_valid',
  'left_eye_valid',
  'right_eye_valid',
  'blink_left',
  'blink_right',
  'pupil_left_out_of_bounds',
  'pupil_right_out_of_bounds',
  'pupil_asymmetry_exceeded',
  'interpolated_left_pupil',
  'interpolated_right_pupil',
] as const;

export const GAZE_QUALITY_VIEW_COLUMNS = [
  'frame',
  'time_s',
  'gaze_status',
  'left_eye_status',
  'right_eye_status',
  'left_eye_openness',
  'right_eye_openness',
  'focus_distance',
  'focus_stability',
  'gaze_valid',
  'left_eye_valid',
  'right_eye_valid',
  'blink_left',
  'blink_right',
  'focus_distance_sentinel',
  'focus_out_of_bounds',
  'focus_unstable',
  'in_invalid_run',
  'invalid_run_id',
] as const;

/**
 * Verify the raw token layout flattens to exactly the 42 source columns.
 * Cheap structural invariant; exercised by the schema test.
 */
export function assertSchemaIntegrity(): void {
  if (FLAT_COLUMNS.length !== SOURCE_COLUMNS.length) {
    throw new Error(
      `schema: RAW_LAYOUT expands to ${FLAT_COLUMNS.length} columns, expected ${SOURCE_COLUMNS.length}`,
    );
  }
  const seen = new Set<string>();
  for (const name of FLAT_COLUMNS) {
    if (seen.has(name))
      throw new Error(`schema: duplicate output column "${name}"`);
    seen.add(name);
  }
}
