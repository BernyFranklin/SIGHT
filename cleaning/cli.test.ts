// @vitest-environment node
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runCli } from './cli';

const slicePath = fileURLToPath(
  new URL('./fixtures/ID002_slice.csv', import.meta.url),
);

describe('runCli — clean', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'gaze-cli-'));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it('writes all six artifacts and exits 0', async () => {
    const code = await runCli(['clean', '--input', slicePath, '--out', dir]);
    expect(code).toBe(0);
    for (const suffix of [
      '.cleaned.csv',
      '.saccade.csv',
      '.pupillometry.csv',
      '.gaze_quality.csv',
      '.qa.json',
      '.qa.md',
    ]) {
      await expect(
        access(path.join(dir, `ID002_slice${suffix}`)),
      ).resolves.toBeUndefined();
    }
    const qa = JSON.parse(
      await readFile(path.join(dir, 'ID002_slice.qa.json'), 'utf-8'),
    );
    expect(qa.total_frames).toBe(400);
  });

  it('honours short flags', async () => {
    const code = await runCli(['clean', '-i', slicePath, '-o', dir]);
    expect(code).toBe(0);
  });
});

describe('runCli — errors', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('returns 1 with no command (usage)', async () => {
    expect(await runCli([])).toBe(1);
  });

  it('returns 1 when --input is missing', async () => {
    expect(await runCli(['clean', '--out', 'x'])).toBe(1);
  });

  it('returns 1 on an unknown command', async () => {
    expect(await runCli(['frobnicate'])).toBe(1);
  });

  it('returns 0 for explicit --help', async () => {
    expect(await runCli(['--help'])).toBe(0);
  });
});
