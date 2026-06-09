// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import {
  addBigIntColumn,
  addNumColumn,
  createTable,
  getNum,
  type Table,
} from '../frame';

import { deriveColumns } from './deriveColumns';

/** Build a table with the columns deriveColumns reads. */
function makeTable(
  captureNs: bigint[],
  forward: [number, number, number][],
): Table {
  const n = captureNs.length;
  const t = createTable(n);
  addBigIntColumn(t, 'capture_time', BigInt64Array.from(captureNs));
  addNumColumn(
    t,
    'combined_gaze_forward_x',
    Float64Array.from(forward.map((f) => f[0])),
  );
  addNumColumn(
    t,
    'combined_gaze_forward_y',
    Float64Array.from(forward.map((f) => f[1])),
  );
  addNumColumn(
    t,
    'combined_gaze_forward_z',
    Float64Array.from(forward.map((f) => f[2])),
  );
  return t;
}

const BASE = 1_000_003_884_631_745_500n;

describe('deriveColumns — time axis', () => {
  it('rebases time to start at 0 and is monotonic', () => {
    const t = makeTable(
      [BASE, BASE + 5_000_000n, BASE + 10_000_000n],
      [
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
      ],
    );
    deriveColumns(t, resolveConfig());
    const timeS = getNum(t, 'time_s');
    expect(timeS[0]).toBe(0);
    expect(timeS[1]).toBeCloseTo(0.005, 9);
    expect(timeS[2]).toBeCloseTo(0.01, 9);
    expect(timeS[1]).toBeGreaterThan(timeS[0]);
  });

  it('computes sample_dt_ms with NaN for the first frame', () => {
    const t = makeTable(
      [BASE, BASE + 5_000_000n, BASE + 5_000_000n + 4_980_000n],
      [
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
      ],
    );
    deriveColumns(t, resolveConfig());
    const dt = getNum(t, 'sample_dt_ms');
    expect(dt[0]).toBeNaN();
    expect(dt[1]).toBeCloseTo(5.0, 6);
    expect(dt[2]).toBeCloseTo(4.98, 6);
  });
});

describe('deriveColumns — gaze angles', () => {
  it('derives azimuth/elevation from the forward vector when enabled', () => {
    const t = makeTable(
      [BASE, BASE + 5_000_000n, BASE + 10_000_000n],
      [
        [0, 0, 1], // straight ahead
        [1, 0, 0], // 90° to the right
        [0, 1, 0], // 90° up
      ],
    );
    deriveColumns(t, resolveConfig());
    const az = getNum(t, 'gaze_azimuth_deg');
    const el = getNum(t, 'gaze_elevation_deg');
    expect(az[0]).toBeCloseTo(0, 6);
    expect(el[0]).toBeCloseTo(0, 6);
    expect(az[1]).toBeCloseTo(90, 6);
    expect(el[2]).toBeCloseTo(90, 6);
  });

  it('omits angle columns when derivation is disabled', () => {
    const t = makeTable([BASE], [[0, 0, 1]]);
    deriveColumns(t, resolveConfig({ derive_gaze_angles: false }));
    expect(t.cols.has('gaze_azimuth_deg')).toBe(false);
  });

  it('yields NaN angles for missing (INVALID-frame) forward components', () => {
    const t = makeTable([BASE], [[NaN, NaN, NaN]]);
    deriveColumns(t, resolveConfig());
    expect(getNum(t, 'gaze_azimuth_deg')[0]).toBeNaN();
    expect(getNum(t, 'gaze_elevation_deg')[0]).toBeNaN();
  });
});
