// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import {
  addNumColumn,
  createTable,
  getBool,
  getNum,
  type Table,
} from '../frame';

import { interpolatePupils } from './interpolate';

/** Build a table with time_ms and the two pupil-diameter columns. */
function makeTable(timeMs: number[], left: number[], right?: number[]): Table {
  const t = createTable(timeMs.length);
  addNumColumn(t, 'time_ms', Float64Array.from(timeMs));
  addNumColumn(t, 'left_pupil_diameter_mm', Float64Array.from(left));
  addNumColumn(t, 'right_pupil_diameter_mm', Float64Array.from(right ?? left));
  return t;
}

const N = NaN;

describe('interpolatePupils — linear (default)', () => {
  it('fills a short interior gap and flags exactly the filled samples', () => {
    const t = makeTable([0, 5, 10, 15, 20], [3, N, N, N, 5]);
    interpolatePupils(t, resolveConfig());
    const left = getNum(t, 'left_pupil_diameter_mm');
    expect(left[1]).toBeCloseTo(3.5, 9);
    expect(left[2]).toBeCloseTo(4.0, 9);
    expect(left[3]).toBeCloseTo(4.5, 9);
    expect([...getBool(t, 'interpolated_left_pupil')]).toEqual([0, 1, 1, 1, 0]);
  });

  it('leaves a gap longer than the threshold as NaN', () => {
    // 200 ms span between anchors > default 150 ms.
    const t = makeTable([0, 100, 200], [3, N, 5]);
    interpolatePupils(t, resolveConfig());
    expect(getNum(t, 'left_pupil_diameter_mm')[1]).toBeNaN();
    expect(getBool(t, 'interpolated_left_pupil')[1]).toBe(0);
  });

  it('leaves edge-anchored (leading/trailing) NaN runs untouched', () => {
    const t = makeTable([0, 5, 10, 15], [N, 3, 4, N]);
    interpolatePupils(t, resolveConfig());
    const left = getNum(t, 'left_pupil_diameter_mm');
    expect(left[0]).toBeNaN();
    expect(left[3]).toBeNaN();
    expect([...getBool(t, 'interpolated_left_pupil')]).toEqual([0, 0, 0, 0]);
  });

  it('interpolates the two pupil columns independently', () => {
    const t = makeTable([0, 5, 10], [3, N, 5], [4, 4, 4]);
    interpolatePupils(t, resolveConfig());
    expect(getNum(t, 'left_pupil_diameter_mm')[1]).toBeCloseTo(4.0, 9);
    expect([...getBool(t, 'interpolated_left_pupil')]).toEqual([0, 1, 0]);
    expect([...getBool(t, 'interpolated_right_pupil')]).toEqual([0, 0, 0]);
  });
});

describe('interpolatePupils — none', () => {
  it('fills nothing but still adds zeroed flag columns', () => {
    const t = makeTable([0, 5, 10], [3, N, 5]);
    interpolatePupils(t, resolveConfig({ pupil_interpolation_method: 'none' }));
    expect(getNum(t, 'left_pupil_diameter_mm')[1]).toBeNaN();
    expect(t.cols.has('interpolated_left_pupil')).toBe(true);
    expect([...getBool(t, 'interpolated_left_pupil')]).toEqual([0, 0, 0]);
  });
});

describe('interpolatePupils — cubic_spline', () => {
  it('reproduces the linear value when surrounding points are collinear', () => {
    // Collinear ramp ⇒ cubic Hermite tangents equal the secant ⇒ exact line.
    const t = makeTable([0, 5, 10, 15, 20], [2, 3, N, 5, 6]);
    interpolatePupils(
      t,
      resolveConfig({ pupil_interpolation_method: 'cubic_spline' }),
    );
    expect(getNum(t, 'left_pupil_diameter_mm')[2]).toBeCloseTo(4.0, 9);
    expect(getBool(t, 'interpolated_left_pupil')[2]).toBe(1);
  });

  it('stays within the bracket for a curved signal', () => {
    const t = makeTable([0, 5, 10, 15, 20], [2, 3, N, 4.5, 5]);
    interpolatePupils(
      t,
      resolveConfig({ pupil_interpolation_method: 'cubic_spline' }),
    );
    const v = getNum(t, 'left_pupil_diameter_mm')[2];
    expect(v).toBeGreaterThan(3);
    expect(v).toBeLessThan(4.5);
  });
});
