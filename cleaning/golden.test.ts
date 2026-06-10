// @vitest-environment node
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { cleanRecording } from './pipeline/cleanRecording';

/**
 * Golden test: end-to-end clean of the committed 400-row slice of the real
 * ID.002 recording, pinned to headline QA numbers. If the cleaning logic changes
 * these on purpose, re-run `npm run clean -- --input cleaning/fixtures/ID002_slice.csv
 * --out cleaned` and update the expectations below from the emitted qa.json.
 */
describe('golden — ID002_slice with default config', () => {
  const slicePath = fileURLToPath(
    new URL('./fixtures/ID002_slice.csv', import.meta.url),
  );

  it('matches the committed QA headline numbers', async () => {
    const { report } = await cleanRecording(slicePath);

    expect(report.recording_id).toBe('ID002_slice');
    expect(report.total_frames).toBe(400);
    expect(report.inferred_sample_rate_hz).toBeCloseTo(199, 0);

    expect(report.validity.gaze_valid).toBe(288);
    expect(report.validity.left_eye_valid).toBe(287);
    expect(report.validity.right_eye_valid).toBe(284);

    expect(report.invalid_runs).toEqual({
      count: 3,
      total_frames: 110,
      max_length: 74,
      mean_length: 110 / 3,
    });

    expect(report.sentinel_replacements).toEqual({
      focus_distance_sentinel: 0,
      focus_out_of_bounds: 13,
      pupil_left_out_of_bounds: 26,
      pupil_right_out_of_bounds: 26,
    });

    expect(report.blinks).toEqual({ left: 22, right: 26 });
    expect(report.pupil_asymmetry_exceeded).toBe(0);
    expect(report.focus_unstable).toBe(212);

    expect(report.interpolation.method).toBe('linear');
    expect(report.interpolation.left_interpolated).toBe(65);
    expect(report.interpolation.right_interpolated).toBe(50);

    expect(report.excluded).toBe(112); // = 400 − 288 valid (gate ⊇ the 110 gap frames)
    expect(report.status).toBe('warn'); // 72% < 75%
  });
});
