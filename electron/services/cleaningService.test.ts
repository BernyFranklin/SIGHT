// @vitest-environment node
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildRawCsv, type SynthRow } from '@cleaning/synthRecording';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  hasCleaningReport,
  readCleaningReport,
  runCleaning,
} from './cleaningService';

const ID = 'case-123';
const rows: SynthRow[] = [
  { gaze: 'VALID' },
  { gaze: 'VALID' },
  { gaze: 'INVALID', left: 'INVALID', right: 'INVALID' },
];

describe('cleaningService', () => {
  let project: string;

  beforeEach(async () => {
    project = await mkdtemp(path.join(tmpdir(), 'gaze-svc-'));
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

  it('cleans the case gaze file and writes artifacts under .sight/cleaned/<id>/', async () => {
    expect(hasCleaningReport(project, ID)).toBe(false);

    const report = await runCleaning(project, ID);
    expect(report.recording_id).toBe(ID);
    expect(report.total_frames).toBe(3);

    const outDir = path.join(project, '.sight', 'cleaned', ID);
    for (const suffix of [
      '.cleaned.csv',
      '.saccade.csv',
      '.qa.json',
      '.qa.md',
    ]) {
      await expect(
        access(path.join(outDir, `${ID}${suffix}`)),
      ).resolves.toBeUndefined();
    }
    expect(hasCleaningReport(project, ID)).toBe(true);
  });

  it('reads back a written report and applies config overrides', async () => {
    await runCleaning(project, ID, { pupil_interpolation_method: 'none' });
    const report = await readCleaningReport(project, ID);
    expect(report?.config.pupil_interpolation_method).toBe('none');
  });

  it('returns null when no report exists yet', async () => {
    expect(await readCleaningReport(project, 'nope')).toBeNull();
  });

  it('rejects when the case has no gaze file', async () => {
    await expect(runCleaning(project, 'missing')).rejects.toThrow(
      /gaze file not found/,
    );
  });
});
