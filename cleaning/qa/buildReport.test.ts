// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../config';
import { cleanRecordingText } from '../pipeline/cleanRecording';
import { buildRawCsv, type SynthRow } from '../synthRecording';

import { reportToMarkdown } from './buildReport';

const GAP: SynthRow = { gaze: 'INVALID', left: 'INVALID', right: 'INVALID' };

// A 12-frame recording exercising every QA statistic deterministically.
const rows: SynthRow[] = [
  { gaze: 'VALID' }, // 0
  { gaze: 'VALID' }, // 1
  GAP, // 2
  GAP, // 3
  GAP, // 4
  GAP, // 5
  GAP, // 6  → a single INVALID run of 5 (rows 2–6)
  { gaze: 'VALID', focus: 0 }, // 7  focus sentinel
  { gaze: 'VALID', leftDia: 12 }, // 8  left pupil out of bounds
  { gaze: 'VALID', leftOpen: 0.3 }, // 9  left blink
  { gaze: 'VALID', leftDia: 3, rightDia: 4 }, // 10 asymmetry
  { gaze: 'VALID', stability: 0.1 }, // 11 focus unstable
];

// Interpolation off so pupil gap-filling does not perturb the headline counts.
const report = cleanRecordingText(
  buildRawCsv(rows),
  resolveConfig({ pupil_interpolation_method: 'none' }),
).report;

describe('buildReport — headline statistics', () => {
  it('counts frames, duration, and sample rate', () => {
    expect(report.total_frames).toBe(12);
    expect(report.duration_s).toBeCloseTo(0.055, 6); // 11 × 5 ms
    expect(report.inferred_sample_rate_hz).toBeCloseTo(200, 3);
  });

  it('reports gaze validity and warns below the threshold', () => {
    expect(report.validity.gaze_valid).toBe(7);
    expect(report.validity.gaze_valid_ratio).toBeCloseTo(7 / 12, 6);
    expect(report.status).toBe('warn'); // 58% < 75%
    expect(report.warnings).toHaveLength(1);
  });

  it('summarizes the INVALID run as a single 5-frame gap', () => {
    expect(report.invalid_runs).toEqual({
      count: 1,
      total_frames: 5,
      max_length: 5,
      mean_length: 5,
    });
  });

  it('counts sentinel and out-of-bounds replacements', () => {
    expect(report.sentinel_replacements.focus_distance_sentinel).toBe(1);
    expect(report.sentinel_replacements.focus_out_of_bounds).toBe(0);
    expect(report.sentinel_replacements.pupil_left_out_of_bounds).toBe(1);
  });

  it('counts blinks, asymmetry, and instability', () => {
    expect(report.blinks).toEqual({ left: 1, right: 0 });
    expect(report.pupil_asymmetry_exceeded).toBe(1);
    expect(report.focus_unstable).toBe(1);
  });

  it('reports no interpolation when the method is none', () => {
    expect(report.interpolation.method).toBe('none');
    expect(report.interpolation.left_interpolated).toBe(0);
    expect(report.interpolation.right_interpolated).toBe(0);
  });

  it('rolls up exclusions from the default gate', () => {
    expect(report.excluded).toBe(5); // the gap frames
    expect(report.excluded_pct).toBeCloseTo((5 / 12) * 100, 6);
  });

  it('echoes the config used', () => {
    expect(report.config.pupil_interpolation_method).toBe('none');
    expect(report.config.min_valid_frame_ratio).toBe(0.75);
  });
});

describe('reportToMarkdown', () => {
  it('renders the headline numbers and warnings', () => {
    const md = reportToMarkdown(report);
    expect(md).toContain('# Gaze Cleaning QA Report');
    expect(md).toContain('**Status:** WARN');
    expect(md).toContain('Inferred sample rate:');
    expect(md).toContain('⚠️');
    expect(md).toContain('```json');
  });
});
