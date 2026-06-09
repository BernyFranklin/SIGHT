// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import { addBoolColumn, createTable, getBool, type Table } from '../frame';

import { flagExcluded } from './excluded';

/** Build a table holding only the boolean flags the gate reads. */
function makeFlagTable(
  flags: Partial<Record<string, number[]>>,
  n: number,
): Table {
  const t = createTable(n);
  const names = [
    'gaze_valid',
    'in_invalid_run',
    'blink_left',
    'blink_right',
    'pupil_left_out_of_bounds',
    'pupil_right_out_of_bounds',
    'pupil_asymmetry_exceeded',
    'focus_distance_sentinel',
    'focus_out_of_bounds',
  ];
  for (const name of names) {
    const values =
      flags[name] ?? new Array<number>(n).fill(name === 'gaze_valid' ? 1 : 0);
    addBoolColumn(t, name, Uint8Array.from(values));
  }
  return t;
}

describe('flagExcluded — default gate', () => {
  it('excludes invalid gaze or in-gap frames, keeps the rest', () => {
    const t = makeFlagTable(
      {
        gaze_valid: [1, 0, 1, 1],
        in_invalid_run: [0, 0, 1, 0],
        blink_left: [0, 0, 0, 1], // blink not excluded by default
      },
      4,
    );
    flagExcluded(t, resolveConfig());
    expect([...getBool(t, 'excluded')]).toEqual([0, 1, 1, 0]);
  });
});

describe('flagExcluded — custom gate', () => {
  it('additionally excludes blink frames when configured', () => {
    const t = makeFlagTable({ gaze_valid: [1, 1], blink_left: [0, 1] }, 2);
    flagExcluded(
      t,
      resolveConfig({ inclusion_gate: { exclude_blinks: true } }),
    );
    expect([...getBool(t, 'excluded')]).toEqual([0, 1]);
  });

  it('can exclude asymmetry and focus frames independently', () => {
    const t = makeFlagTable(
      {
        gaze_valid: [1, 1, 1],
        pupil_asymmetry_exceeded: [1, 0, 0],
        focus_out_of_bounds: [0, 1, 0],
      },
      3,
    );
    flagExcluded(
      t,
      resolveConfig({
        inclusion_gate: {
          exclude_asymmetry: true,
          exclude_focus_out_of_bounds: true,
        },
      }),
    );
    expect([...getBool(t, 'excluded')]).toEqual([1, 1, 0]);
  });
});
