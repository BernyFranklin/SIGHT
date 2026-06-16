/**
 * Saccade-event shapes and the detection tuning knobs.
 *
 * Ported from the EyeDHD pipeline (`saccades/core/schema.ts`). The default
 * thresholds are tuned for the Varjo XR-series headset running at ~200 Hz and
 * are the locked starting point for SIGHT; they can be overridden per run.
 */

import type { Vec3 } from './velocities';

/** Varjo headset default; real runs pass the cleaning-inferred rate instead. */
export const DEFAULT_SAMPLING_RATE_HZ = 200;

/** A detected saccade, expressed in indices/times of the analyzed stream. */
export interface SaccadeEvent {
  /** Index of the first above-threshold sample (inclusive). */
  startIndex: number;
  /** Index of the last above-threshold sample (inclusive). */
  endIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  durationMs: number;
  peakVelocityDegPerSec: number;
  meanVelocityDegPerSec: number;
  /** Angular displacement over the saccade, in degrees (∑ velocity·dt). */
  amplitudeDeg: number;
}

/** A {@link SaccadeEvent} plus optional endpoint vectors and direction. */
export interface SaccadeEventExtended extends SaccadeEvent {
  direction?: Vec3;
  startVector?: Vec3;
  endVector?: Vec3;
}

export interface SaccadeDetectionOptions {
  /** Sampling rate of the analyzed stream, in Hz (fixed dt = 1/rate). */
  samplingRate: number;
  /** Samples at/above this angular velocity (deg/s) are saccadic. */
  velocityThresholdDegPerSec: number;
  /** Reject candidate saccades shorter than this. */
  minDurationMs: number;
  /** Upper sanity bound on saccade duration. */
  maxDurationMs: number;
  /** Merge candidates separated by less than this refractory gap. */
  minInterSaccadeMs: number;
  /** Whether to also emit endpoint vectors / direction per saccade. */
  includeExtended: boolean;
}

export const DEFAULT_SACCADE_OPTIONS: SaccadeDetectionOptions = {
  samplingRate: DEFAULT_SAMPLING_RATE_HZ,
  velocityThresholdDegPerSec: 100,
  minDurationMs: 10,
  maxDurationMs: 150,
  minInterSaccadeMs: 50,
  includeExtended: true,
};
