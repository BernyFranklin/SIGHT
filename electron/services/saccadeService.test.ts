// @vitest-environment node
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildRawCsv, type SynthRow } from '@cleaning/synthRecording';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runCleaning } from '@electron/services/cleaningService';

import {
  hasSaccadeReport,
  readSaccadeReport,
  runSaccadeAnalysis,
} from './saccadeService';

const ID = 'case-123';
const rows: SynthRow[] = Array.from({ length: 10 }, (_, i) => ({
  gaze: i === 5 ? 'INVALID' : 'VALID',
}));

describe('saccadeService', () => {
  let project: string;

  beforeEach(async () => {
    project = await mkdtemp(path.join(tmpdir(), 'saccade-svc-'));
    const casesDir = path.join(project, '.sight', 'cases');
    await mkdir(casesDir, { recursive: true });
    await writeFile(
      path.join(casesDir, `${ID}.csv`),
      buildRawCsv(rows),
      'utf-8',
    );
  });

  afterEach(async () => {
    await rm(project, { recursive: true, force: true });
  });

  it('analyzes a cleaned case and writes artifacts under .sight/saccades/<id>/', async () => {
    // Saccade analysis depends on the cleaning stage having run first.
    await runCleaning(project, ID);
    expect(hasSaccadeReport(project, ID)).toBe(false);

    const report = await runSaccadeAnalysis(project, ID);
    expect(report.recording_id).toBe(ID);
    expect(report.total_frames).toBe(rows.length);
    // One INVALID frame is excluded from analysis.
    expect(report.analyzed_frames).toBe(rows.length - 1);

    const outDir = path.join(project, '.sight', 'saccades', ID);
    for (const suffix of ['.frames.csv', '.saccades.csv', '.saccade.json']) {
      await expect(
        access(path.join(outDir, `${ID}${suffix}`)),
      ).resolves.toBeUndefined();
    }
    expect(hasSaccadeReport(project, ID)).toBe(true);
  });

  it('reads back a written report', async () => {
    await runCleaning(project, ID);
    await runSaccadeAnalysis(project, ID);
    const report = await readSaccadeReport(project, ID);
    expect(report?.recording_id).toBe(ID);
  });

  it('returns null when no saccade report exists yet', async () => {
    expect(await readSaccadeReport(project, 'nope')).toBeNull();
  });

  it('rejects when the case has not been cleaned', async () => {
    await expect(runSaccadeAnalysis(project, ID)).rejects.toThrow(
      /has not been cleaned/,
    );
  });
});
