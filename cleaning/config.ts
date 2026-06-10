/**
 * Typed cleaning configuration.
 *
 * Every threshold the pipeline uses lives here — no magic numbers in the
 * cleaning logic. Defaults come from the project's configuration spec
 * (Holmqvist et al. 2011 for gaze/saccade; Mathôt 2018 for pupillometry) and
 * are echoed verbatim into each QA report for reproducibility.
 */

import { readFile } from 'node:fs/promises';

/** Raised when a config fails range/consistency validation. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export type PupilInterpolationMethod = 'linear' | 'cubic_spline' | 'none';

export const PUPIL_INTERPOLATION_METHODS: readonly PupilInterpolationMethod[] =
  ['linear', 'cubic_spline', 'none'];

/**
 * Which conditions roll up into the per-frame `excluded` flag. Each downstream
 * module can request a different gate without re-cleaning. The default matches
 * the spec: `excluded = (not gaze_valid) OR in_invalid_run`.
 */
export interface InclusionGateConfig {
  /** Exclude frames where GazeStatus != VALID. */
  exclude_invalid_gaze: boolean;
  /** Exclude frames inside a flagged INVALID run (data gap). */
  exclude_invalid_runs: boolean;
  /** Exclude blink-candidate frames (either eye below the openness threshold). */
  exclude_blinks: boolean;
  /** Exclude frames with either pupil out of physiological bounds. */
  exclude_pupil_out_of_bounds: boolean;
  /** Exclude frames where L/R pupil asymmetry exceeds tolerance. */
  exclude_asymmetry: boolean;
  /** Exclude frames where focus distance is sentinel/out-of-bounds. */
  exclude_focus_out_of_bounds: boolean;
}

export interface CleaningConfig {
  // --- Validity & gaps ---
  /** Warn in the QA report if the overall valid-frame ratio falls below this (0–1). */
  min_valid_frame_ratio: number;
  /** Runs of consecutive INVALID frames at/above this length are marked as gaps. */
  max_consecutive_invalid_for_gap: number;
  /** Gaps longer than this (ms) are flagged as unsafe for inter-frame velocity downstream. */
  max_gap_for_velocity_ms: number;

  // --- Eye openness / blink ---
  /** Eye openness (ratio 0–1) below this marks a blink candidate, even if status is VALID. */
  eye_openness_blink_threshold: number;

  // --- Pupil plausibility ---
  /** Minimum physiological pupil diameter (mm); below → flag + NaN. */
  pupil_min_diameter_mm: number;
  /** Maximum physiological pupil diameter (mm); above → flag + NaN. */
  pupil_max_diameter_mm: number;
  /** Flag frames where |left − right| pupil diameter exceeds this (mm). */
  pupil_lr_asymmetry_tolerance_mm: number;

  // --- Pupil gap interpolation (optional, always flagged) ---
  /** Interpolation method for short pupil gaps. */
  pupil_interpolation_method: PupilInterpolationMethod;
  /** Only pupil gaps shorter than this (ms) are interpolated; longer stay NaN. */
  pupil_blink_max_gap_ms: number;

  // --- Focus / vergence (Varjo-specific) ---
  /** Minimum plausible focus distance (m); below → flag + NaN. */
  focus_min_distance_m: number;
  /** Maximum plausible focus distance (m); above → flag + NaN. */
  focus_max_distance_m: number;
  /** Focus stability below this → focus_unstable flag (value is not nulled). */
  focus_min_stability: number;

  // --- Derived signals ---
  /** Derive gaze_azimuth_deg / gaze_elevation_deg from the combined forward vector. */
  derive_gaze_angles: boolean;

  // --- Inclusion gate ---
  inclusion_gate: InclusionGateConfig;
}

/** Defaults from spec §6. Deeply frozen; use {@link resolveConfig} to derive a run config. */
export const DEFAULT_CONFIG: CleaningConfig = Object.freeze({
  min_valid_frame_ratio: 0.75,
  max_consecutive_invalid_for_gap: 5,
  max_gap_for_velocity_ms: 25,

  eye_openness_blink_threshold: 0.5,

  pupil_min_diameter_mm: 1.5,
  pupil_max_diameter_mm: 9.0,
  pupil_lr_asymmetry_tolerance_mm: 0.5,

  pupil_interpolation_method: 'linear',
  pupil_blink_max_gap_ms: 150,

  focus_min_distance_m: 0.2,
  focus_max_distance_m: 10.0,
  focus_min_stability: 0.3,

  derive_gaze_angles: true,

  inclusion_gate: Object.freeze({
    exclude_invalid_gaze: true,
    exclude_invalid_runs: true,
    exclude_blinks: false,
    exclude_pupil_out_of_bounds: false,
    exclude_asymmetry: false,
    exclude_focus_out_of_bounds: false,
  }),
}) as CleaningConfig;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** A user-supplied partial config (e.g. parsed from JSON). */
export type CleaningConfigOverrides = DeepPartial<CleaningConfig>;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function inRange(v: number, lo: number, hi: number): boolean {
  return v >= lo && v <= hi;
}

/**
 * Validate ranges and consistency. Collects all problems and throws a single
 * {@link ConfigError} listing them, so a malformed config surfaces every issue
 * at once.
 */
export function validateConfig(config: CleaningConfig): void {
  const errors: string[] = [];

  const ratios: [keyof CleaningConfig, number][] = [
    ['min_valid_frame_ratio', config.min_valid_frame_ratio],
    ['eye_openness_blink_threshold', config.eye_openness_blink_threshold],
    ['focus_min_stability', config.focus_min_stability],
  ];
  for (const [name, value] of ratios) {
    if (!isFiniteNumber(value) || !inRange(value, 0, 1)) {
      errors.push(`${String(name)} must be in [0, 1], got ${value}`);
    }
  }

  if (
    !Number.isInteger(config.max_consecutive_invalid_for_gap) ||
    config.max_consecutive_invalid_for_gap < 1
  ) {
    errors.push(
      `max_consecutive_invalid_for_gap must be an integer ≥ 1, got ${config.max_consecutive_invalid_for_gap}`,
    );
  }

  const nonNegative: [keyof CleaningConfig, number][] = [
    ['max_gap_for_velocity_ms', config.max_gap_for_velocity_ms],
    ['pupil_lr_asymmetry_tolerance_mm', config.pupil_lr_asymmetry_tolerance_mm],
    ['pupil_blink_max_gap_ms', config.pupil_blink_max_gap_ms],
  ];
  for (const [name, value] of nonNegative) {
    if (!isFiniteNumber(value) || value < 0) {
      errors.push(`${String(name)} must be a finite number ≥ 0, got ${value}`);
    }
  }

  if (
    !isFiniteNumber(config.pupil_min_diameter_mm) ||
    config.pupil_min_diameter_mm <= 0
  ) {
    errors.push(
      `pupil_min_diameter_mm must be > 0, got ${config.pupil_min_diameter_mm}`,
    );
  }
  if (
    !isFiniteNumber(config.pupil_max_diameter_mm) ||
    config.pupil_max_diameter_mm <= 0
  ) {
    errors.push(
      `pupil_max_diameter_mm must be > 0, got ${config.pupil_max_diameter_mm}`,
    );
  }
  if (config.pupil_min_diameter_mm >= config.pupil_max_diameter_mm) {
    errors.push(
      `pupil_min_diameter_mm (${config.pupil_min_diameter_mm}) must be < pupil_max_diameter_mm (${config.pupil_max_diameter_mm})`,
    );
  }

  if (
    !isFiniteNumber(config.focus_min_distance_m) ||
    config.focus_min_distance_m < 0
  ) {
    errors.push(
      `focus_min_distance_m must be ≥ 0, got ${config.focus_min_distance_m}`,
    );
  }
  if (
    !isFiniteNumber(config.focus_max_distance_m) ||
    config.focus_max_distance_m <= 0
  ) {
    errors.push(
      `focus_max_distance_m must be > 0, got ${config.focus_max_distance_m}`,
    );
  }
  if (config.focus_min_distance_m >= config.focus_max_distance_m) {
    errors.push(
      `focus_min_distance_m (${config.focus_min_distance_m}) must be < focus_max_distance_m (${config.focus_max_distance_m})`,
    );
  }

  if (
    !PUPIL_INTERPOLATION_METHODS.includes(config.pupil_interpolation_method)
  ) {
    errors.push(
      `pupil_interpolation_method must be one of ${PUPIL_INTERPOLATION_METHODS.join(', ')}, got "${config.pupil_interpolation_method}"`,
    );
  }

  if (errors.length > 0) {
    throw new ConfigError(
      `Invalid cleaning config:\n  - ${errors.join('\n  - ')}`,
    );
  }
}

/**
 * Merge user overrides onto {@link DEFAULT_CONFIG} (one level of nesting for the
 * inclusion gate), validate, and return a fresh mutable config.
 */
export function resolveConfig(
  overrides: CleaningConfigOverrides = {},
): CleaningConfig {
  const config: CleaningConfig = {
    ...DEFAULT_CONFIG,
    ...overrides,
    inclusion_gate: {
      ...DEFAULT_CONFIG.inclusion_gate,
      ...(overrides.inclusion_gate ?? {}),
    },
  } as CleaningConfig;
  validateConfig(config);
  return config;
}

/** Read a JSON config file, merge it over the defaults, validate, and return it. */
export async function loadConfigFile(path: string): Promise<CleaningConfig> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf-8');
  } catch (err) {
    throw new ConfigError(
      `could not read config file "${path}": ${(err as Error).message}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ConfigError(
      `config file "${path}" is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ConfigError(`config file "${path}" must contain a JSON object`);
  }
  return resolveConfig(parsed as CleaningConfigOverrides);
}
