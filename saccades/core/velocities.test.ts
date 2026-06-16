// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  angularDisplacementDeg,
  angularVelocityDegPerSec,
  computeAngularVelocitiesDegPerSec,
  type Vec3,
} from './velocities';

describe('angularDisplacementDeg', () => {
  it('is 0 between identical directions', () => {
    expect(
      angularDisplacementDeg({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 1 }),
    ).toBeCloseTo(0, 9);
  });

  it('is 90° between orthogonal directions', () => {
    expect(
      angularDisplacementDeg({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }),
    ).toBeCloseTo(90, 9);
  });

  it('normalizes non-unit inputs', () => {
    expect(
      angularDisplacementDeg({ x: 2, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }),
    ).toBeCloseTo(90, 9);
  });

  it('throws on a zero-length vector', () => {
    expect(() =>
      angularDisplacementDeg({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }),
    ).toThrow();
  });
});

describe('angularVelocityDegPerSec', () => {
  it('divides displacement by the time delta', () => {
    // 90° over 0.5 s = 180 °/s
    expect(
      angularVelocityDegPerSec({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, 0.5),
    ).toBeCloseTo(180, 6);
  });

  it('throws on a non-positive time delta', () => {
    expect(() =>
      angularVelocityDegPerSec({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, 0),
    ).toThrow();
  });
});

describe('computeAngularVelocitiesDegPerSec', () => {
  it('returns [] for an empty input and [0] for a single sample', () => {
    expect(computeAngularVelocitiesDegPerSec([], 100)).toEqual([]);
    expect(
      computeAngularVelocitiesDegPerSec([{ x: 0, y: 0, z: 1 }], 100),
    ).toEqual([0]);
  });

  it('pins velocities[0] = 0 and matches input length', () => {
    const vectors: Vec3[] = [
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ];
    const v = computeAngularVelocitiesDegPerSec(vectors, 100);
    expect(v).toHaveLength(3);
    expect(v[0]).toBe(0);
    // 90° at dt = 0.01 s → 9000 °/s, then no movement.
    expect(v[1]).toBeCloseTo(9000, 3);
    expect(v[2]).toBeCloseTo(0, 9);
  });

  it('throws on an invalid sampling rate', () => {
    expect(() =>
      computeAngularVelocitiesDegPerSec([{ x: 0, y: 0, z: 1 }], 0),
    ).toThrow();
  });
});
