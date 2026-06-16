# Gaze Data Cleaning Module

The first stage of the SIGHT analysis pipeline. It ingests a raw **Varjo XR4**
eye-tracking CSV export and produces a clean, validated, fully-flagged master
frame plus three per-module views and a QA report — the inputs the **Saccade**,
**Pupillometry**, and **Gaze Quality** modules expect.

It does **not** perform those analyses. Its job is to parse, structure, validate,
flag, and (optionally) interpolate the raw data so downstream work is trivial and
reproducible. **Nothing is silently dropped** — every exclusion is a boolean flag
and every transformation is recorded in the QA report.

This is a TypeScript port of the original Python spec, fitted to SIGHT's
conventions (columnar typed arrays, co-located Vitest tests, `@cleaning` alias).

## Input contract

- 42 header columns, Windows (`\r\n`) line endings.
- Several columns are **parenthesized tuples** (`(0.033, -0.007, 0.999)`) whose
  internal commas are _not_ field separators — a naïve `split(',')` mis-aligns
  every column after the first tuple. The reader tokenizes on commas outside
  parentheses and expands tuples into scalar columns (`schema.ts`).
- `CaptureTime` is a nanosecond clock (~1.0e18, ~200 Hz). It exceeds
  `Number.MAX_SAFE_INTEGER`, so it is parsed as **BigInt** and rebased before
  conversion to seconds/milliseconds.
- During INVALID frames the exporter writes the gaze/eye/focus fields **empty**;
  these become `NaN` (not `0`) and are flagged.

The reader validates the header against the 42 expected names and each row's
field/tuple arity, failing loudly with the offending row number.

## Outputs

### Master cleaned frame

All signal columns (snake_case) + derived columns (`time_s`, `time_ms`,
`sample_dt_ms`, and optional `gaze_azimuth_deg` / `gaze_elevation_deg`) + all
provenance flags + a rolled-up `excluded` flag. One row per source frame.

### Three views (exact column subsets)

- **Saccade** — `frame, time_s, gaze_status, combined_gaze_forward_{x,y,z},
gaze_valid, in_invalid_run, sample_dt_ms` (+ `gaze_azimuth_deg`,
  `gaze_elevation_deg` when angle derivation is enabled).
- **Pupillometry** — frame/time, both pupil diameters & iris ratios, validity,
  blink, pupil-bounds, asymmetry, and `interpolated_*` flags.
- **Gaze Quality** — frame/time, statuses, openness, focus distance/stability,
  validity, blink, focus sentinel/bounds/instability, and gap columns.

### QA report (`.json` + `.md`)

Frame count, duration, inferred sample rate, validity ratios, gap counts/lengths,
sentinel & out-of-bounds counts, blinks, interpolation %, exclusion %, a
`pass`/`warn` status, and the **exact config echoed back** for reproducibility.

## Configuration

All thresholds live in a typed `CleaningConfig` (`config.ts`) with the spec
defaults; see `config.example.json`. Load and override with `loadConfigFile` or
`resolveConfig`. Key fields:

| Field                                             | Default             | Meaning                                               |
| ------------------------------------------------- | ------------------- | ----------------------------------------------------- |
| `min_valid_frame_ratio`                           | 0.75                | Warn if overall valid ratio falls below               |
| `max_consecutive_invalid_for_gap`                 | 5                   | INVALID runs ≥ this are data gaps                     |
| `max_gap_for_velocity_ms`                         | 25                  | Gaps longer than this flagged for downstream velocity |
| `eye_openness_blink_threshold`                    | 0.5                 | Below → blink candidate (status-independent)          |
| `pupil_min_diameter_mm` / `pupil_max_diameter_mm` | 1.5 / 9.0           | Out → flag + NaN                                      |
| `pupil_lr_asymmetry_tolerance_mm`                 | 0.5                 | \|L−R\| above → flag                                  |
| `pupil_interpolation_method`                      | `linear`            | `linear` \| `cubic_spline` \| `none`                  |
| `pupil_blink_max_gap_ms`                          | 150                 | Only shorter gaps are interpolated                    |
| `focus_min_distance_m` / `focus_max_distance_m`   | 0.2 / 10.0          | Out → flag + NaN (`==0` → sentinel)                   |
| `focus_min_stability`                             | 0.3                 | Below → `focus_unstable` (value kept)                 |
| `derive_gaze_angles`                              | true                | Add azimuth/elevation convenience columns             |
| `inclusion_gate`                                  | invalid-gaze + gaps | Configurable predicate rolled into `excluded`         |

## Usage

### Programmatic

```ts
import { cleanRecording, resolveConfig } from '@cleaning';

const result = await cleanRecording(
  'path/to/ID.002.csv',
  resolveConfig({
    pupil_interpolation_method: 'cubic_spline',
  }),
);

result.frame; // master cleaned Table
result.saccadeView; // per-module views
result.pupillometryView;
result.gazeQualityView;
result.report; // QaReport (status, counts, echoed config)
await result.save('./cleaned'); // write CSVs + qa.json + qa.md
```

### CLI

```bash
npm run clean -- --input path/to/ID.002.csv --out ./cleaned [--config config.example.json]
```

Writes `<id>.cleaned.csv`, `<id>.saccade.csv`, `<id>.pupillometry.csv`,
`<id>.gaze_quality.csv`, `<id>.qa.json`, and `<id>.qa.md` (id = input file base
name). Runs via `tsx`; outputs are CSV/JSON/Markdown (no Parquet dependency).

## Tests

Co-located `*.test.ts`, run with `npm test`. Coverage spans the tuple parser,
config validation, every flag/derivation, interpolation, views, QA stats, the
CLI, and a **golden** end-to-end test pinned to a committed 400-row slice of the
real `ID.002.csv`.
