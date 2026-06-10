// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ConfigError,
  DEFAULT_CONFIG,
  loadConfigFile,
  resolveConfig,
  validateConfig,
  type CleaningConfig,
} from './config';

describe('DEFAULT_CONFIG', () => {
  it('matches the spec §6 defaults', () => {
    expect(DEFAULT_CONFIG.min_valid_frame_ratio).toBe(0.75);
    expect(DEFAULT_CONFIG.max_consecutive_invalid_for_gap).toBe(5);
    expect(DEFAULT_CONFIG.max_gap_for_velocity_ms).toBe(25);
    expect(DEFAULT_CONFIG.eye_openness_blink_threshold).toBe(0.5);
    expect(DEFAULT_CONFIG.pupil_min_diameter_mm).toBe(1.5);
    expect(DEFAULT_CONFIG.pupil_max_diameter_mm).toBe(9.0);
    expect(DEFAULT_CONFIG.pupil_lr_asymmetry_tolerance_mm).toBe(0.5);
    expect(DEFAULT_CONFIG.pupil_interpolation_method).toBe('linear');
    expect(DEFAULT_CONFIG.pupil_blink_max_gap_ms).toBe(150);
    expect(DEFAULT_CONFIG.focus_min_distance_m).toBe(0.2);
    expect(DEFAULT_CONFIG.focus_max_distance_m).toBe(10.0);
    expect(DEFAULT_CONFIG.focus_min_stability).toBe(0.3);
    expect(DEFAULT_CONFIG.inclusion_gate.exclude_invalid_gaze).toBe(true);
    expect(DEFAULT_CONFIG.inclusion_gate.exclude_invalid_runs).toBe(true);
    expect(DEFAULT_CONFIG.inclusion_gate.exclude_blinks).toBe(false);
  });

  it('is frozen against mutation', () => {
    expect(Object.isFrozen(DEFAULT_CONFIG)).toBe(true);
    expect(Object.isFrozen(DEFAULT_CONFIG.inclusion_gate)).toBe(true);
  });

  it('validates clean', () => {
    expect(() => validateConfig(DEFAULT_CONFIG)).not.toThrow();
  });
});

describe('resolveConfig', () => {
  it('returns defaults when given no overrides', () => {
    expect(resolveConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('returns a fresh mutable object (not the frozen default)', () => {
    const cfg = resolveConfig();
    expect(Object.isFrozen(cfg)).toBe(false);
    expect(cfg).not.toBe(DEFAULT_CONFIG);
  });

  it('overrides top-level fields while keeping the rest', () => {
    const cfg = resolveConfig({ pupil_max_diameter_mm: 8.0 });
    expect(cfg.pupil_max_diameter_mm).toBe(8.0);
    expect(cfg.pupil_min_diameter_mm).toBe(1.5);
  });

  it('merges a partial inclusion_gate rather than replacing it', () => {
    const cfg = resolveConfig({ inclusion_gate: { exclude_blinks: true } });
    expect(cfg.inclusion_gate.exclude_blinks).toBe(true);
    // Untouched gate fields keep their defaults.
    expect(cfg.inclusion_gate.exclude_invalid_gaze).toBe(true);
    expect(cfg.inclusion_gate.exclude_asymmetry).toBe(false);
  });
});

describe('validateConfig', () => {
  const bad = (over: Partial<CleaningConfig>) => () => resolveConfig(over);

  it('rejects a ratio outside [0, 1]', () => {
    expect(bad({ min_valid_frame_ratio: 1.5 })).toThrow(ConfigError);
    expect(bad({ eye_openness_blink_threshold: -0.1 })).toThrow(/\[0, 1\]/);
  });

  it('rejects pupil_min ≥ pupil_max', () => {
    expect(bad({ pupil_min_diameter_mm: 9, pupil_max_diameter_mm: 9 })).toThrow(
      /pupil_min_diameter_mm.*<.*pupil_max_diameter_mm/,
    );
  });

  it('rejects focus_min ≥ focus_max', () => {
    expect(bad({ focus_min_distance_m: 10, focus_max_distance_m: 5 })).toThrow(
      ConfigError,
    );
  });

  it('rejects an unknown interpolation method', () => {
    expect(bad({ pupil_interpolation_method: 'quadratic' as never })).toThrow(
      /pupil_interpolation_method/,
    );
  });

  it('rejects a non-integer gap length', () => {
    expect(bad({ max_consecutive_invalid_for_gap: 2.5 })).toThrow(/integer/);
  });

  it('aggregates multiple problems into one error', () => {
    expect(bad({ min_valid_frame_ratio: 2, focus_min_stability: -1 })).toThrow(
      /min_valid_frame_ratio[\s\S]*focus_min_stability/,
    );
  });
});

describe('loadConfigFile', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'gaze-cfg-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads JSON and merges over defaults', async () => {
    const file = path.join(dir, 'override.json');
    await writeFile(
      file,
      JSON.stringify({ pupil_blink_max_gap_ms: 100 }),
      'utf-8',
    );
    const cfg = await loadConfigFile(file);
    expect(cfg.pupil_blink_max_gap_ms).toBe(100);
    expect(cfg.pupil_min_diameter_mm).toBe(1.5);
  });

  it('loads the committed example config to the defaults', async () => {
    const example = fileURLToPath(
      new URL('./config.example.json', import.meta.url),
    );
    const cfg = await loadConfigFile(example);
    expect(cfg).toEqual(DEFAULT_CONFIG);
  });

  it('throws ConfigError on malformed JSON', async () => {
    const file = path.join(dir, 'broken.json');
    await writeFile(file, '{ not json', 'utf-8');
    await expect(loadConfigFile(file)).rejects.toThrow(ConfigError);
  });

  it('throws ConfigError on a missing file', async () => {
    await expect(loadConfigFile(path.join(dir, 'nope.json'))).rejects.toThrow(
      ConfigError,
    );
  });
});
