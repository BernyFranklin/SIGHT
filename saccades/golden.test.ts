// @vitest-environment node
import { fileURLToPath } from 'node:url';

import { cleanRecording, toCsv } from '@cleaning';
import { describe, expect, it } from 'vitest';

import { runSaccadeAnalysisText } from './pipeline/runSaccadeAnalysis';

/**
 * Golden test: clean the committed 400-row slice of the real ID.002 recording,
 * then run saccade analysis over its saccade view at the cleaning-inferred rate.
 * Pins headline numbers (analyzed frames, saccade count, amplitude median). If
 * the detection logic or thresholds change on purpose, update the expectations
 * below from a fresh run.
 */
describe('golden — ID002_slice saccade analysis with default options', () => {
  const slicePath = fileURLToPath(
    new URL('../cleaning/fixtures/ID002_slice.csv', import.meta.url),
  );

  it('matches the committed headline saccade numbers', async () => {
    const cleaned = await cleanRecording(slicePath);
    const saccadeCsv = toCsv(cleaned.saccadeView);

    const result = runSaccadeAnalysisText(saccadeCsv, {
      samplingRateHz: cleaned.report.inferred_sample_rate_hz,
      recordingId: 'ID002_slice',
    });

    const { report } = result;
    expect(report.recording_id).toBe('ID002_slice');
    expect(report.total_frames).toBe(400);
    // 288 gaze-valid frames, minus any inside INVALID runs.
    expect(report.analyzed_frames).toBe(288);
    expect(report.sampling_rate_hz).toBeCloseTo(199, 0);

    // Headline detection numbers, pinned from a clean run with default options.
    expect(report.saccade_count).toBe(3);
    expect(report.amplitude_deg.median).toBeCloseTo(29.3716, 3);

    // Structural invariants independent of the pinned values.
    expect(result.frames).toHaveLength(report.analyzed_frames);
    expect(result.saccades).toHaveLength(report.saccade_count);
    expect(result.frames[0].velocityDegPerSec).toBe(0);
  });
});
