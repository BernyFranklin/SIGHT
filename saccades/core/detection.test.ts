// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { detectSaccadesFromVectors } from './detection';
import type { Vec3 } from './velocities';

/** Unit direction at azimuth `deg` in the XZ plane (displacement = |Δazimuth|). */
function dir(deg: number): Vec3 {
  const r = (deg * Math.PI) / 180;
  return { x: Math.sin(r), y: 0, z: Math.cos(r) };
}

describe('detectSaccadesFromVectors', () => {
  it('detects no saccades in a steady fixation', () => {
    const vectors = Array.from({ length: 20 }, () => dir(0));
    const { saccades } = detectSaccadesFromVectors(vectors, {
      samplingRate: 100,
    });
    expect(saccades).toHaveLength(0);
  });

  it('detects a single high-velocity burst as one saccade', () => {
    // 100 Hz (dt = 0.01 s); 3°/sample steps = 300 °/s, well above the 100 °/s default.
    const thetas = [0, 0, 0, 0, 0, 3, 6, 9, 9, 9, 9, 9];
    const vectors = thetas.map(dir);

    const { saccades, velocitiesDegPerSec } = detectSaccadesFromVectors(
      vectors,
      {
        samplingRate: 100,
      },
    );

    expect(velocitiesDegPerSec[0]).toBe(0);
    expect(velocitiesDegPerSec).toHaveLength(thetas.length);

    expect(saccades).toHaveLength(1);
    const s = saccades[0];
    expect(s.startIndex).toBe(5);
    expect(s.endIndex).toBe(7);
    expect(s.amplitudeDeg).toBeCloseTo(9, 6); // three 3° steps
    expect(s.peakVelocityDegPerSec).toBeCloseTo(300, 3);
    expect(s.durationMs).toBeCloseTo(20, 6); // (7 − 5) · 0.01 s · 1000
  });

  it('drops bursts shorter than the minimum duration', () => {
    // A single 1.5° step then hold: only one above-threshold sample (150 °/s at
    // index 3, then 0), so the interval spans one sample → duration 0 ms < 10 ms
    // default → rejected.
    const thetas = [0, 0, 0, 1.5, 1.5, 1.5, 1.5];
    const vectors = thetas.map(dir);
    const { saccades } = detectSaccadesFromVectors(vectors, {
      samplingRate: 100,
    });
    expect(saccades).toHaveLength(0);
  });
});
