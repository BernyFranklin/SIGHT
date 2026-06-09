// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import {
  addNumColumn,
  addStrColumn,
  createTable,
  getBool,
  getNum,
  type Table,
} from '../frame';

import { computeFlags } from './flags';

interface Cols {
  gaze_status: string[];
  left_eye_status: string[];
  right_eye_status: string[];
  left_pupil_diameter_mm: number[];
  right_pupil_diameter_mm: number[];
  left_pupil_iris_ratio: number[];
  right_pupil_iris_ratio: number[];
  left_eye_openness: number[];
  right_eye_openness: number[];
  focus_distance: number[];
  focus_stability: number[];
}

function makeTable(cols: Cols): Table {
  const n = cols.gaze_status.length;
  const t = createTable(n);
  addStrColumn(t, 'gaze_status', cols.gaze_status);
  addStrColumn(t, 'left_eye_status', cols.left_eye_status);
  addStrColumn(t, 'right_eye_status', cols.right_eye_status);
  addNumColumn(
    t,
    'left_pupil_diameter_mm',
    Float64Array.from(cols.left_pupil_diameter_mm),
  );
  addNumColumn(
    t,
    'right_pupil_diameter_mm',
    Float64Array.from(cols.right_pupil_diameter_mm),
  );
  addNumColumn(
    t,
    'left_pupil_iris_ratio',
    Float64Array.from(cols.left_pupil_iris_ratio),
  );
  addNumColumn(
    t,
    'right_pupil_iris_ratio',
    Float64Array.from(cols.right_pupil_iris_ratio),
  );
  addNumColumn(
    t,
    'left_eye_openness',
    Float64Array.from(cols.left_eye_openness),
  );
  addNumColumn(
    t,
    'right_eye_openness',
    Float64Array.from(cols.right_eye_openness),
  );
  addNumColumn(t, 'focus_distance', Float64Array.from(cols.focus_distance));
  addNumColumn(t, 'focus_stability', Float64Array.from(cols.focus_stability));
  return t;
}

const V = 'VALID';
const I = 'INVALID';
const config = resolveConfig();

describe('computeFlags', () => {
  it('derives validity flags from the status columns', () => {
    const t = makeTable({
      gaze_status: [V, I],
      left_eye_status: [V, I],
      right_eye_status: [V, V],
      left_pupil_diameter_mm: [3, 3],
      right_pupil_diameter_mm: [3, 3],
      left_pupil_iris_ratio: [0.4, 0.4],
      right_pupil_iris_ratio: [0.4, 0.4],
      left_eye_openness: [0.9, 0.9],
      right_eye_openness: [0.9, 0.9],
      focus_distance: [1, 1],
      focus_stability: [0.9, 0.9],
    });
    computeFlags(t, config);
    expect([...getBool(t, 'gaze_valid')]).toEqual([1, 0]);
    expect([...getBool(t, 'left_eye_valid')]).toEqual([1, 0]);
    expect([...getBool(t, 'right_eye_valid')]).toEqual([1, 1]);
  });

  it('flags and nulls out-of-bounds pupil diameters', () => {
    const t = makeTable({
      gaze_status: [V, V],
      left_eye_status: [V, V],
      right_eye_status: [V, V],
      left_pupil_diameter_mm: [0.5, 3], // below 1.5
      right_pupil_diameter_mm: [3, 10], // above 9.0
      left_pupil_iris_ratio: [0.4, 0.4],
      right_pupil_iris_ratio: [0.4, 0.4],
      left_eye_openness: [0.9, 0.9],
      right_eye_openness: [0.9, 0.9],
      focus_distance: [1, 1],
      focus_stability: [0.9, 0.9],
    });
    computeFlags(t, config);
    expect([...getBool(t, 'pupil_left_out_of_bounds')]).toEqual([1, 0]);
    expect([...getBool(t, 'pupil_right_out_of_bounds')]).toEqual([0, 1]);
    expect(getNum(t, 'left_pupil_diameter_mm')[0]).toBeNaN();
    expect(getNum(t, 'right_pupil_diameter_mm')[1]).toBeNaN();
  });

  it('treats an in-bounds pupil on an INVALID eye frame as a sentinel (nulled, not OOB)', () => {
    const t = makeTable({
      gaze_status: [I],
      left_eye_status: [I],
      right_eye_status: [I],
      left_pupil_diameter_mm: [2.0], // plausible value, but eye is INVALID
      right_pupil_diameter_mm: [2.0],
      left_pupil_iris_ratio: [0.4],
      right_pupil_iris_ratio: [0.4],
      left_eye_openness: [0.9],
      right_eye_openness: [0.9],
      focus_distance: [1],
      focus_stability: [0.9],
    });
    computeFlags(t, config);
    expect(getNum(t, 'left_pupil_diameter_mm')[0]).toBeNaN();
    expect(getNum(t, 'left_pupil_iris_ratio')[0]).toBeNaN();
    expect(getBool(t, 'pupil_left_out_of_bounds')[0]).toBe(0);
  });

  it('flags L/R asymmetry beyond tolerance', () => {
    const t = makeTable({
      gaze_status: [V, V],
      left_eye_status: [V, V],
      right_eye_status: [V, V],
      left_pupil_diameter_mm: [3.0, 3.0],
      right_pupil_diameter_mm: [4.0, 3.2], // |1.0| > 0.5 ; |0.2| ≤ 0.5
      left_pupil_iris_ratio: [0.4, 0.4],
      right_pupil_iris_ratio: [0.4, 0.4],
      left_eye_openness: [0.9, 0.9],
      right_eye_openness: [0.9, 0.9],
      focus_distance: [1, 1],
      focus_stability: [0.9, 0.9],
    });
    computeFlags(t, config);
    expect([...getBool(t, 'pupil_asymmetry_exceeded')]).toEqual([1, 0]);
  });

  it('flags blinks by openness threshold independent of status', () => {
    const t = makeTable({
      gaze_status: [V, V],
      left_eye_status: [V, V],
      right_eye_status: [V, V],
      left_pupil_diameter_mm: [3, 3],
      right_pupil_diameter_mm: [3, 3],
      left_pupil_iris_ratio: [0.4, 0.4],
      right_pupil_iris_ratio: [0.4, 0.4],
      left_eye_openness: [0.3, 0.9], // below / above 0.5
      right_eye_openness: [0.9, 0.4],
      focus_distance: [1, 1],
      focus_stability: [0.9, 0.9],
    });
    computeFlags(t, config);
    expect([...getBool(t, 'blink_left')]).toEqual([1, 0]);
    expect([...getBool(t, 'blink_right')]).toEqual([0, 1]);
  });

  it('classifies focus sentinel, out-of-bounds, and instability', () => {
    const t = makeTable({
      gaze_status: [V, V, V, V],
      left_eye_status: [V, V, V, V],
      right_eye_status: [V, V, V, V],
      left_pupil_diameter_mm: [3, 3, 3, 3],
      right_pupil_diameter_mm: [3, 3, 3, 3],
      left_pupil_iris_ratio: [0.4, 0.4, 0.4, 0.4],
      right_pupil_iris_ratio: [0.4, 0.4, 0.4, 0.4],
      left_eye_openness: [0.9, 0.9, 0.9, 0.9],
      right_eye_openness: [0.9, 0.9, 0.9, 0.9],
      focus_distance: [0, 0.1, 20, 1.0], // sentinel, below-min, above-max, ok
      focus_stability: [0.9, 0.9, 0.9, 0.1], // last is unstable
    });
    computeFlags(t, config);
    expect([...getBool(t, 'focus_distance_sentinel')]).toEqual([1, 0, 0, 0]);
    expect([...getBool(t, 'focus_out_of_bounds')]).toEqual([0, 1, 1, 0]);
    expect(getNum(t, 'focus_distance')[0]).toBeNaN();
    expect(getNum(t, 'focus_distance')[1]).toBeNaN();
    expect(getNum(t, 'focus_distance')[2]).toBeNaN();
    expect(getNum(t, 'focus_distance')[3]).toBe(1.0);
    // Instability flags but preserves the value.
    expect([...getBool(t, 'focus_unstable')]).toEqual([0, 0, 0, 1]);
    expect(getNum(t, 'focus_stability')[3]).toBe(0.1);
  });
});
