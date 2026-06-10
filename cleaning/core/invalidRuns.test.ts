// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import {
  addStrColumn,
  createTable,
  getBool,
  getNum,
  type Table,
} from '../frame';

import { flagInvalidRuns } from './invalidRuns';

/** Build a table from a compact status string: 'V' = VALID, 'I' = INVALID. */
function fromStatus(pattern: string): Table {
  const statuses = [...pattern].map((c) => (c === 'V' ? 'VALID' : 'INVALID'));
  const t = createTable(statuses.length);
  addStrColumn(t, 'gaze_status', statuses);
  return t;
}

const config = resolveConfig(); // max_consecutive_invalid_for_gap = 5

describe('flagInvalidRuns', () => {
  it('flags a run of exactly the threshold length as one gap', () => {
    const t = fromStatus('VVIIIIIVV'); // 5 INVALID
    flagInvalidRuns(t, config);
    const inRun = getBool(t, 'in_invalid_run');
    const id = getNum(t, 'invalid_run_id');
    expect([...inRun]).toEqual([0, 0, 1, 1, 1, 1, 1, 0, 0]);
    expect(id[2]).toBe(0);
    expect(id[6]).toBe(0);
    expect(id[0]).toBeNaN();
  });

  it('leaves a sub-threshold INVALID run unflagged', () => {
    const t = fromStatus('VVIIIIVV'); // 4 INVALID < 5
    flagInvalidRuns(t, config);
    expect([...getBool(t, 'in_invalid_run')]).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(getNum(t, 'invalid_run_id').every(Number.isNaN)).toBe(true);
  });

  it('assigns distinct ids to separate gaps', () => {
    const t = fromStatus('IIIIIVVIIIIII'); // run of 5, then run of 6
    flagInvalidRuns(t, config);
    const id = getNum(t, 'invalid_run_id');
    expect(id[0]).toBe(0);
    expect(id[4]).toBe(0);
    expect(id[7]).toBe(1);
    expect(id[12]).toBe(1);
  });

  it('flags a gap that runs to the end of the recording', () => {
    const t = fromStatus('VVVIIIII');
    flagInvalidRuns(t, config);
    const inRun = getBool(t, 'in_invalid_run');
    expect(inRun[7]).toBe(1);
    expect(inRun[2]).toBe(0);
  });
});
