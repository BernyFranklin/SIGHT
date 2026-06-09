/**
 * Per-frame / per-eye provenance flags, plus the sentinel→NaN replacements the
 * spec requires. Nothing is dropped: every implausible or missing value is set
 * to NaN *and* recorded in a boolean flag column so downstream modules can
 * reconstruct exactly what happened.
 */

import type { CleaningConfig } from '../config';
import { addBoolColumn, getNum, getStr, type Table } from '../frame';
import { STATUS_VALID } from '../schema';

/**
 * Compute validity/blink/pupil/focus flags and null sentinels in place.
 * Must run before {@link flagExcluded}. Mutates and returns `table`.
 */
export function computeFlags(table: Table, config: CleaningConfig): Table {
  const n = table.numRows;

  const gazeStatus = getStr(table, 'gaze_status');
  const leftStatus = getStr(table, 'left_eye_status');
  const rightStatus = getStr(table, 'right_eye_status');

  const gazeValid = new Uint8Array(n);
  const leftValid = new Uint8Array(n);
  const rightValid = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    gazeValid[i] = gazeStatus[i] === STATUS_VALID ? 1 : 0;
    leftValid[i] = leftStatus[i] === STATUS_VALID ? 1 : 0;
    rightValid[i] = rightStatus[i] === STATUS_VALID ? 1 : 0;
  }

  // --- Pupil: sentinel-on-invalid, physiological bounds, asymmetry ---
  const leftDia = getNum(table, 'left_pupil_diameter_mm');
  const rightDia = getNum(table, 'right_pupil_diameter_mm');
  const leftRatio = getNum(table, 'left_pupil_iris_ratio');
  const rightRatio = getNum(table, 'right_pupil_iris_ratio');
  const leftOob = new Uint8Array(n);
  const rightOob = new Uint8Array(n);
  const asymmetry = new Uint8Array(n);

  const { pupil_min_diameter_mm: pMin, pupil_max_diameter_mm: pMax } = config;
  const tol = config.pupil_lr_asymmetry_tolerance_mm;

  for (let i = 0; i < n; i++) {
    // A pupil reading during an INVALID eye frame is a sentinel, even if it
    // sits inside physiological bounds (spec §4.5) — null it.
    if (!leftValid[i]) {
      leftDia[i] = NaN;
      leftRatio[i] = NaN;
    }
    if (!rightValid[i]) {
      rightDia[i] = NaN;
      rightRatio[i] = NaN;
    }

    if (!Number.isNaN(leftDia[i]) && (leftDia[i] < pMin || leftDia[i] > pMax)) {
      leftOob[i] = 1;
      leftDia[i] = NaN;
    }
    if (
      !Number.isNaN(rightDia[i]) &&
      (rightDia[i] < pMin || rightDia[i] > pMax)
    ) {
      rightOob[i] = 1;
      rightDia[i] = NaN;
    }

    if (
      !Number.isNaN(leftDia[i]) &&
      !Number.isNaN(rightDia[i]) &&
      Math.abs(leftDia[i] - rightDia[i]) > tol
    ) {
      asymmetry[i] = 1;
    }
  }

  // --- Blink: eye openness below threshold, independent of status ---
  const leftOpen = getNum(table, 'left_eye_openness');
  const rightOpen = getNum(table, 'right_eye_openness');
  const blinkLeft = new Uint8Array(n);
  const blinkRight = new Uint8Array(n);
  const blinkThresh = config.eye_openness_blink_threshold;
  for (let i = 0; i < n; i++) {
    // NaN openness (INVALID frames) is not a blink candidate; eye_valid covers it.
    blinkLeft[i] = leftOpen[i] < blinkThresh ? 1 : 0;
    blinkRight[i] = rightOpen[i] < blinkThresh ? 1 : 0;
  }

  // --- Focus: sentinel (==0), out-of-bounds, instability ---
  const focus = getNum(table, 'focus_distance');
  const stability = getNum(table, 'focus_stability');
  const focusSentinel = new Uint8Array(n);
  const focusOob = new Uint8Array(n);
  const focusUnstable = new Uint8Array(n);
  const { focus_min_distance_m: fMin, focus_max_distance_m: fMax } = config;
  const sMin = config.focus_min_stability;
  for (let i = 0; i < n; i++) {
    if (focus[i] === 0) {
      focusSentinel[i] = 1;
      focus[i] = NaN;
    } else if (
      !Number.isNaN(focus[i]) &&
      (focus[i] < fMin || focus[i] > fMax)
    ) {
      focusOob[i] = 1;
      focus[i] = NaN;
    }
    // Instability flags but does not null the value — downstream decides.
    focusUnstable[i] =
      !Number.isNaN(stability[i]) && stability[i] < sMin ? 1 : 0;
  }

  addBoolColumn(table, 'gaze_valid', gazeValid);
  addBoolColumn(table, 'left_eye_valid', leftValid);
  addBoolColumn(table, 'right_eye_valid', rightValid);
  addBoolColumn(table, 'blink_left', blinkLeft);
  addBoolColumn(table, 'blink_right', blinkRight);
  addBoolColumn(table, 'pupil_left_out_of_bounds', leftOob);
  addBoolColumn(table, 'pupil_right_out_of_bounds', rightOob);
  addBoolColumn(table, 'pupil_asymmetry_exceeded', asymmetry);
  addBoolColumn(table, 'focus_distance_sentinel', focusSentinel);
  addBoolColumn(table, 'focus_out_of_bounds', focusOob);
  addBoolColumn(table, 'focus_unstable', focusUnstable);
  return table;
}
