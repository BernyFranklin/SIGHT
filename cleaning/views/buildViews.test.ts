// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import { getNum } from '../frame';
import { cleanRecordingText } from '../pipeline/cleanRecording';
import {
  GAZE_QUALITY_VIEW_COLUMNS,
  PUPILLOMETRY_VIEW_COLUMNS,
  SACCADE_VIEW_ANGLE_COLUMNS,
  SACCADE_VIEW_COLUMNS,
} from '../schema';
import { buildRawCsv } from '../synthRecording';

const csv = buildRawCsv([
  { gaze: 'VALID' },
  { gaze: 'INVALID', left: 'INVALID', right: 'INVALID' },
  { gaze: 'VALID' },
]);

describe('buildViews', () => {
  it('produces the saccade view with exactly its columns (+ angles when enabled)', () => {
    const result = cleanRecordingText(csv, resolveConfig());
    expect(result.saccadeView.order).toEqual([
      ...SACCADE_VIEW_COLUMNS,
      ...SACCADE_VIEW_ANGLE_COLUMNS,
    ]);
  });

  it('omits angle columns from the saccade view when disabled', () => {
    const result = cleanRecordingText(
      csv,
      resolveConfig({ derive_gaze_angles: false }),
    );
    expect(result.saccadeView.order).toEqual([...SACCADE_VIEW_COLUMNS]);
  });

  it('produces the pupillometry and gaze-quality views with exactly their columns', () => {
    const result = cleanRecordingText(csv, resolveConfig());
    expect(result.pupillometryView.order).toEqual([
      ...PUPILLOMETRY_VIEW_COLUMNS,
    ]);
    expect(result.gazeQualityView.order).toEqual([
      ...GAZE_QUALITY_VIEW_COLUMNS,
    ]);
  });

  it('has no NaN in the index/time columns, even across INVALID frames', () => {
    const result = cleanRecordingText(csv, resolveConfig());
    for (const view of [
      result.saccadeView,
      result.pupillometryView,
      result.gazeQualityView,
    ]) {
      expect([...getNum(view, 'frame')].every(Number.isFinite)).toBe(true);
      expect([...getNum(view, 'time_s')].every(Number.isFinite)).toBe(true);
    }
  });
});
