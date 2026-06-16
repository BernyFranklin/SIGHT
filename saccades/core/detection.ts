/**
 * Velocity-threshold saccade detection (I-VT style).
 *
 * Pipeline: angular velocity per sample → contiguous runs at/above the velocity
 * threshold → merge runs closer than the refractory gap → drop runs shorter
 * than the minimum duration → summarize each surviving run as a {@link SaccadeEvent}.
 *
 * Ported from the EyeDHD pipeline (`saccades/core/detection.ts`); thresholds and
 * the index/time conventions are preserved exactly.
 */

import {
  DEFAULT_SACCADE_OPTIONS,
  type SaccadeDetectionOptions,
  type SaccadeEvent,
  type SaccadeEventExtended,
} from './schema';
import { computeAngularVelocitiesDegPerSec, type Vec3 } from './velocities';

export interface DetectSaccadeResult {
  velocitiesDegPerSec: number[];
  saccades: SaccadeEvent[];
  saccadesExtended: SaccadeEventExtended[];
}

/** Inclusive index range into the analyzed stream. */
interface Interval {
  startIndex: number;
  endIndex: number;
}

function findAboveThresholdIntervals(
  velocities: number[],
  threshold: number,
): Interval[] {
  const intervals: Interval[] = [];
  let start: number | null = null;

  // Start at 1: velocities[0] is 0 by convention (no prior sample).
  for (let i = 1; i < velocities.length; i++) {
    const isSaccadeSample = velocities[i] >= threshold;
    if (isSaccadeSample && start === null) {
      start = i;
    } else if (!isSaccadeSample && start !== null) {
      intervals.push({ startIndex: start, endIndex: i - 1 });
      start = null;
    }
  }

  if (start !== null) {
    intervals.push({ startIndex: start, endIndex: velocities.length - 1 });
  }

  return intervals;
}

function mergeCloseIntervals(
  intervals: Interval[],
  minGapSamples: number,
): Interval[] {
  if (intervals.length <= 1) return intervals;

  const merged: Interval[] = [{ ...intervals[0] }];
  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = intervals[i];
    const gap = curr.startIndex - prev.endIndex - 1;
    if (gap < minGapSamples) {
      prev.endIndex = curr.endIndex;
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
}

/** Locked convention: duration = (end − start) · dt. */
function intervalDurationMs(interval: Interval, dt: number): number {
  return (interval.endIndex - interval.startIndex) * dt * 1000;
}

function buildSaccadeEvent(
  interval: Interval,
  velocities: number[],
  dt: number,
): SaccadeEvent {
  const { startIndex, endIndex } = interval;

  let peak = -Infinity;
  let sumVel = 0;
  let count = 0;
  // amplitudeDeg = ∑ velocity[i]·dt across the interval.
  let amplitudeDeg = 0;

  for (let i = startIndex; i <= endIndex; i++) {
    const v = velocities[i];
    if (v > peak) peak = v;
    sumVel += v;
    count += 1;
    amplitudeDeg += v * dt;
  }

  const mean = count > 0 ? sumVel / count : 0;

  return {
    startIndex,
    endIndex,
    startTimeSec: startIndex * dt,
    endTimeSec: endIndex * dt,
    durationMs: (endIndex - startIndex) * dt * 1000,
    peakVelocityDegPerSec: peak,
    meanVelocityDegPerSec: mean,
    amplitudeDeg,
  };
}

function buildExtendedEvent(
  base: SaccadeEvent,
  vectors: Vec3[],
): SaccadeEventExtended {
  // Vector just before the first saccadic step, and at the last saccadic index.
  const startVector =
    base.startIndex - 1 >= 0 ? vectors[base.startIndex - 1] : vectors[0];
  const endVector =
    base.endIndex >= 0 && base.endIndex < vectors.length
      ? vectors[base.endIndex]
      : vectors[vectors.length - 1];

  const direction: Vec3 = {
    x: endVector.x - startVector.x,
    y: endVector.y - startVector.y,
    z: endVector.z - startVector.z,
  };

  return { ...base, startVector, endVector, direction };
}

/**
 * Detect saccades from a sequence of gaze-direction vectors sampled at a fixed
 * rate. Returns the per-sample velocity series alongside the detected events so
 * callers can plot the velocity profile without recomputing it.
 */
export function detectSaccadesFromVectors(
  vectors: Vec3[],
  options?: Partial<SaccadeDetectionOptions>,
): DetectSaccadeResult {
  const opts: SaccadeDetectionOptions = {
    ...DEFAULT_SACCADE_OPTIONS,
    ...options,
  };
  const dt = 1 / opts.samplingRate;

  const velocitiesDegPerSec = computeAngularVelocitiesDegPerSec(
    vectors,
    opts.samplingRate,
  );

  const rawIntervals = findAboveThresholdIntervals(
    velocitiesDegPerSec,
    opts.velocityThresholdDegPerSec,
  );

  const minGapSamples = Math.max(
    1,
    Math.round((opts.minInterSaccadeMs / 1000) * opts.samplingRate),
  );
  const intervals = mergeCloseIntervals(rawIntervals, minGapSamples);

  const validIntervals = intervals.filter(
    (iv) => intervalDurationMs(iv, dt) >= opts.minDurationMs,
  );

  const saccades = validIntervals.map((iv) =>
    buildSaccadeEvent(iv, velocitiesDegPerSec, dt),
  );

  const saccadesExtended = opts.includeExtended
    ? saccades.map((s) => buildExtendedEvent(s, vectors))
    : [];

  return { velocitiesDegPerSec, saccades, saccadesExtended };
}
