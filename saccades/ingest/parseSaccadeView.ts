/**
 * Ingest for the cleaned saccade-view CSV (written by the cleaning stage at
 * `.sight/cleaned/<id>/<id>.saccade.csv`). Selects the analyzable samples —
 * `gaze_valid` and not inside an INVALID run, with a finite forward vector —
 * and returns them as a contiguous `Vec3[]` for detection, keeping the original
 * frame numbers for provenance.
 *
 * Column set is `cleaning/schema.ts → SACCADE_VIEW_COLUMNS`; we resolve columns
 * by header name (not position) so the view can gain columns without breaking.
 */

import type { Vec3 } from '@saccades/core/velocities';

/** Why a row was dropped from the analyzed stream. */
export interface SaccadeIngestDiagnostics {
  totalRows: number;
  selectedRows: number;
  excludedInvalidGaze: number;
  excludedInGap: number;
  excludedNonFinite: number;
}

export interface SaccadeViewIngest {
  /** Original frame numbers of the selected samples, in order. */
  frames: number[];
  /** Combined-gaze forward directions of the selected samples, in order. */
  vectors: Vec3[];
  diagnostics: SaccadeIngestDiagnostics;
}

/** Parse a numeric cell; empty string (a cleaned NaN) becomes NaN. */
function parseNum(cell: string): number {
  if (cell === '') return NaN;
  return Number(cell);
}

/** Parse a boolean cell as written by the cleaning serializer ('true'/'false'). */
function parseBool(cell: string): boolean {
  return cell === 'true';
}

/**
 * Parse cleaned saccade-view CSV text into the analyzable sample stream. Throws
 * if a required column is missing (a sign the input is not a saccade view).
 */
export function parseSaccadeView(csvText: string): SaccadeViewIngest {
  const lines = csvText.split('\n').filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new Error('saccade view CSV is empty');
  }

  const header = lines[0].split(',');
  const col = new Map<string, number>();
  header.forEach((name, i) => col.set(name, i));

  const requireCol = (name: string): number => {
    const i = col.get(name);
    if (i === undefined) {
      throw new Error(`saccade view CSV missing required column "${name}"`);
    }
    return i;
  };

  const iFrame = requireCol('frame');
  const iX = requireCol('combined_gaze_forward_x');
  const iY = requireCol('combined_gaze_forward_y');
  const iZ = requireCol('combined_gaze_forward_z');
  const iValid = requireCol('gaze_valid');
  const iGap = requireCol('in_invalid_run');

  const frames: number[] = [];
  const vectors: Vec3[] = [];
  const diagnostics: SaccadeIngestDiagnostics = {
    totalRows: lines.length - 1,
    selectedRows: 0,
    excludedInvalidGaze: 0,
    excludedInGap: 0,
    excludedNonFinite: 0,
  };

  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(',');

    if (!parseBool(cells[iValid])) {
      diagnostics.excludedInvalidGaze += 1;
      continue;
    }
    if (parseBool(cells[iGap])) {
      diagnostics.excludedInGap += 1;
      continue;
    }

    const x = parseNum(cells[iX]);
    const y = parseNum(cells[iY]);
    const z = parseNum(cells[iZ]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      diagnostics.excludedNonFinite += 1;
      continue;
    }

    frames.push(parseNum(cells[iFrame]));
    vectors.push({ x, y, z });
    diagnostics.selectedRows += 1;
  }

  return { frames, vectors, diagnostics };
}
