// @vitest-environment node
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import { getBool, getNum, hasColumn } from '../frame';
import { buildRawCsv } from '../synthRecording';

import { cleanRecording, cleanRecordingText } from './cleanRecording';

describe('cleanRecordingText — master frame', () => {
  const csv = buildRawCsv([
    { gaze: 'VALID' },
    { gaze: 'INVALID', left: 'INVALID', right: 'INVALID' },
    { gaze: 'VALID' },
  ]);

  it('produces a master frame with derived, flag, and exclusion columns', () => {
    const { frame } = cleanRecordingText(csv, resolveConfig());
    for (const col of [
      'time_s',
      'sample_dt_ms',
      'gaze_azimuth_deg',
      'gaze_valid',
      'in_invalid_run',
      'excluded',
      'interpolated_left_pupil',
    ]) {
      expect(hasColumn(frame, col)).toBe(true);
    }
    expect(frame.numRows).toBe(3);
    expect([...getBool(frame, 'gaze_valid')]).toEqual([1, 0, 1]);
  });

  it('keeps raw forward components alongside the derived angles', () => {
    const { frame } = cleanRecordingText(csv, resolveConfig());
    expect(hasColumn(frame, 'combined_gaze_forward_x')).toBe(true);
    expect(hasColumn(frame, 'gaze_azimuth_deg')).toBe(true);
  });
});

describe('cleanRecording — real fixture slice', () => {
  const slicePath = fileURLToPath(
    new URL('../fixtures/ID002_slice.csv', import.meta.url),
  );

  it('cleans end-to-end with an internally consistent report', async () => {
    const { frame, report } = await cleanRecording(slicePath);
    expect(frame.numRows).toBe(400);
    expect(report.total_frames).toBe(400);
    // Default recording id is the file base name.
    expect(report.recording_id).toBe('ID002_slice');
    // ~200 Hz recording.
    expect(report.inferred_sample_rate_hz).toBeGreaterThan(150);
    expect(report.inferred_sample_rate_hz).toBeLessThan(250);
    // Validity ratio is a real fraction.
    expect(report.validity.gaze_valid_ratio).toBeGreaterThan(0);
    expect(report.validity.gaze_valid_ratio).toBeLessThanOrEqual(1);
    // time_s starts at 0 and is monotonic non-decreasing.
    const timeS = getNum(frame, 'time_s');
    expect(timeS[0]).toBe(0);
    for (let i = 1; i < timeS.length; i++)
      expect(timeS[i]).toBeGreaterThanOrEqual(timeS[i - 1]);
  });

  it('never excludes more frames than exist, and at least the gap frames', async () => {
    const { report } = await cleanRecording(slicePath);
    expect(report.excluded).toBeGreaterThanOrEqual(
      report.invalid_runs.total_frames,
    );
    expect(report.excluded).toBeLessThanOrEqual(report.total_frames);
  });
});
