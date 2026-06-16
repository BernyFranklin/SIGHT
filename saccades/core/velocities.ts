/**
 * Angular displacement and angular velocity from 3D gaze-direction vectors.
 *
 * Conventions:
 * - Inputs are expected to be finite. Non-unit vectors are normalized.
 * - Velocity is returned in degrees per second.
 * - {@link computeAngularVelocitiesDegPerSec} returns an array the same length
 *   as its input, with `velocities[0] = 0` (no prior sample to compare against).
 *
 * Ported from the EyeDHD pipeline (`saccades/core/velocities.ts`); the math and
 * the `velocities[0] = 0` convention are preserved exactly.
 */

/** A 3D vector — here, a combined-gaze forward direction. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Guard against floating-point drift when comparing magnitudes. */
const EPS = 1e-12;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function isFiniteNumber(n: number): boolean {
  return Number.isFinite(n);
}

function isValidVec3(v: Vec3): boolean {
  if (v === null || typeof v !== 'object') return false;
  return isFiniteNumber(v.x) && isFiniteNumber(v.y) && isFiniteNumber(v.z);
}

function magnitude(v: Vec3): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function normalize(v: Vec3): Vec3 {
  const mag = magnitude(v);
  if (mag < EPS) {
    throw new Error('Cannot normalize zero-length vector');
  }
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Angle between two direction vectors, in degrees. */
export function angularDisplacementDeg(prev: Vec3, current: Vec3): number {
  if (!isValidVec3(prev) || !isValidVec3(current)) {
    throw new Error('Invalid Vec3 input');
  }

  const u = normalize(prev);
  const v = normalize(current);

  // Clamp protects acos against floating-point overshoot past [-1, 1].
  const d = clamp(dot(u, v), -1, 1);
  return Math.acos(d) * (180 / Math.PI);
}

/**
 * Angular velocity between two consecutive samples, in degrees per second.
 * This is the primary signal saccade detection thresholds against.
 */
export function angularVelocityDegPerSec(
  prev: Vec3,
  current: Vec3,
  dtSeconds: number,
): number {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) {
    throw new Error('Invalid time delta');
  }
  return angularDisplacementDeg(prev, current) / dtSeconds;
}

/**
 * Sliding-pair angular velocity for a whole sequence: `velocity[i]` is the
 * velocity between `vectors[i-1]` and `vectors[i]`. The returned array matches
 * the input length so indices stay aligned with the source samples; by
 * convention `velocities[0] = 0` because there is no prior sample.
 */
export function computeAngularVelocitiesDegPerSec(
  vectors: Vec3[],
  samplingRateHz: number,
): number[] {
  if (!Array.isArray(vectors)) {
    throw new Error('Input vectors must be an array');
  }
  if (!Number.isFinite(samplingRateHz) || samplingRateHz <= 0) {
    throw new Error('Invalid sampling rate');
  }

  if (vectors.length === 0) return [];
  if (vectors.length === 1) return [0];

  const dt = 1 / samplingRateHz;
  const velocities = new Array<number>(vectors.length);
  velocities[0] = 0;
  for (let i = 1; i < vectors.length; i++) {
    velocities[i] = angularVelocityDegPerSec(vectors[i - 1], vectors[i], dt);
  }
  return velocities;
}
