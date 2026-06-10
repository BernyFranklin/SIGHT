/**
 * Test-support generator for synthetic raw Varjo CSV text.
 *
 * Not part of the public pipeline — it exists so tests can craft small, exact
 * recordings (specific statuses, sentinels, blinks, gaps) without hand-writing
 * 42-column rows. Mirrors the real exporter's tuple encoding and the convention
 * that INVALID frames leave gaze/eye/focus fields empty.
 */

import { SOURCE_COLUMNS } from './schema';

export interface SynthRow {
  gaze?: 'VALID' | 'INVALID';
  left?: 'VALID' | 'INVALID';
  right?: 'VALID' | 'INVALID';
  forward?: [number, number, number];
  leftDia?: number;
  rightDia?: number;
  leftOpen?: number;
  rightOpen?: number;
  focus?: number;
  stability?: number;
}

export interface SynthOptions {
  /** First CaptureTime in ns. */
  startNs?: bigint;
  /** Inter-frame delta in ns (default 5e6 ⇒ 200 Hz). */
  dtNs?: bigint;
}

const tuple = (...v: number[]) => `(${v.map((x) => x.toFixed(3)).join(', ')})`;

function emit(row: SynthRow, frame: number, captureNs: bigint): string {
  const gaze = row.gaze ?? 'VALID';
  const left = row.left ?? 'VALID';
  const right = row.right ?? 'VALID';
  const fwd = row.forward ?? [0, 0, 1];

  // INVALID gaze ⇒ combined gaze fields blank, mirroring the real exporter.
  const cgf = gaze === 'VALID' ? tuple(...fwd) : '';
  const cgp = gaze === 'VALID' ? tuple(0, 0, 0) : '';

  const leftBlock =
    left === 'VALID'
      ? [
          tuple(...fwd),
          tuple(-0.028, 0, 0),
          '0.420',
          (row.leftDia ?? 3).toFixed(3),
          '6.400',
          (row.leftOpen ?? 0.9).toFixed(3),
        ]
      : ['', '', '', '', '', ''];
  const rightBlock =
    right === 'VALID'
      ? [
          tuple(...fwd),
          tuple(0.028, 0, 0),
          '0.420',
          (row.rightDia ?? 3).toFixed(3),
          '6.400',
          (row.rightOpen ?? 0.9).toFixed(3),
        ]
      : ['', '', '', '', '', ''];

  const focus = row.focus ?? 1.0;
  const stability = row.stability ?? 0.9;

  return [
    String(frame),
    String(captureNs),
    '63875744676000',
    tuple(0, 0, 0), // HMD position (always present)
    tuple(0, 0, 0, 1), // HMD rotation
    gaze,
    cgf,
    cgp,
    '52.000', // IPD
    left,
    ...leftBlock,
    right,
    ...rightBlock,
    focus.toFixed(7),
    stability.toFixed(3),
  ].join(',');
}

/** Build raw Varjo CSV text (CRLF) for the given rows. */
export function buildRawCsv(
  rows: SynthRow[],
  options: SynthOptions = {},
): string {
  const startNs = options.startNs ?? 1_000_003_884_631_745_500n;
  const dtNs = options.dtNs ?? 5_000_000n;
  const header = SOURCE_COLUMNS.join(',');
  const body = rows.map((row, i) =>
    emit(row, 1000 + i, startNs + dtNs * BigInt(i)),
  );
  return [header, ...body].join('\r\n') + '\r\n';
}
