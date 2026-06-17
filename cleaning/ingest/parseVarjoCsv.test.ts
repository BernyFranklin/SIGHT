// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { getBigInt, getNum, getStr } from '../frame';
import { assertSchemaIntegrity, FLAT_COLUMNS, SOURCE_COLUMNS } from '../schema';

import { parseVarjoCsv, tokenizeLine, VarjoParseError } from './parseVarjoCsv';

const HEADER = SOURCE_COLUMNS.join(',');

/** A single fully-populated data row matching the real sample's first frame. */
const ROW1 =
  '725152,1000003884631745500,63875744676000,' +
  '(0.000, 0.000, 0.000),(0.000, 0.000, 0.000, 1.000),VALID,' +
  '(-0.021, -0.034, 0.999),(0.000, 0.000, 0.000),52.375,VALID,' +
  '(0.033, -0.007, 0.999),(-0.028, 0.000, 0.000),0.419,2.888,6.887,0.877,VALID,' +
  '(-0.021, -0.034, 0.999),(0.028, 0.000, 0.000),0.426,2.749,6.454,0.818,0.8338683,0';

const ROW2 =
  '725153,1000003884636765600,63875744676000,' +
  '(0.000, 0.000, 0.000),(0.000, 0.000, 0.000, 1.000),INVALID,' +
  '(-0.020, -0.034, 0.999),(0.000, 0.000, 0.000),52.375,INVALID,' +
  '(0.033, -0.007, 0.999),(-0.028, 0.000, 0.000),0.419,2.000,6.454,0.300,INVALID,' +
  '(-0.020, -0.034, 0.999),(0.028, 0.000, 0.000),0.426,2.000,6.454,0.300,0,0';

/** Join lines with Windows CRLF endings, as the real exporter writes them. */
const crlf = (...lines: string[]) => lines.join('\r\n') + '\r\n';

describe('schema integrity', () => {
  it('expands the raw layout to exactly the 42 source columns', () => {
    expect(() => assertSchemaIntegrity()).not.toThrow();
    expect(FLAT_COLUMNS).toHaveLength(42);
    expect(SOURCE_COLUMNS).toHaveLength(42);
  });
});

describe('tokenizeLine', () => {
  it('keeps parenthesized tuples intact and splits only outer commas', () => {
    const tokens = tokenizeLine(
      '1,(0.0, 1.0, 2.0),VALID,(3.0, 4.0, 5.0, 6.0),7',
    );
    expect(tokens).toEqual([
      '1',
      '(0.0, 1.0, 2.0)',
      'VALID',
      '(3.0, 4.0, 5.0, 6.0)',
      '7',
    ]);
  });
});

describe('parseVarjoCsv', () => {
  it('parses tuple columns into aligned scalar columns', () => {
    const table = parseVarjoCsv(crlf(HEADER, ROW1));
    expect(table.numRows).toBe(1);

    // The tuple (-0.021, -0.034, 0.999) must land in three distinct columns.
    expect(getNum(table, 'combined_gaze_forward_x')[0]).toBeCloseTo(-0.021);
    expect(getNum(table, 'combined_gaze_forward_y')[0]).toBeCloseTo(-0.034);
    expect(getNum(table, 'combined_gaze_forward_z')[0]).toBeCloseTo(0.999);

    // The 4-tuple HMD rotation expands into x/y/z/w.
    expect(getNum(table, 'hmd_rotation_w')[0]).toBeCloseTo(1.0);

    // Scalars after the tuples stay aligned (the whole point of tuple-awareness).
    expect(getNum(table, 'inter_pupillary_distance_mm')[0]).toBeCloseTo(52.375);
    expect(getNum(table, 'left_pupil_diameter_mm')[0]).toBeCloseTo(2.888);
    expect(getNum(table, 'right_eye_openness')[0]).toBeCloseTo(0.818);
    expect(getNum(table, 'focus_distance')[0]).toBeCloseTo(0.8338683);
    expect(getNum(table, 'focus_stability')[0]).toBe(0);
    expect(getStr(table, 'gaze_status')[0]).toBe('VALID');
  });

  it('keeps CaptureTime as a precise bigint (beyond Number.MAX_SAFE_INTEGER)', () => {
    const table = parseVarjoCsv(crlf(HEADER, ROW1, ROW2));
    const capture = getBigInt(table, 'capture_time');
    expect(capture[0]).toBe(1000003884631745500n);
    // ~5.0e6 ns delta ⇒ ~200 Hz; precision would be lost as a float.
    expect(capture[1] - capture[0]).toBe(5020100n);
  });

  it('parses a CaptureTime written in scientific notation', () => {
    // Some exports emit the nanosecond clock as e.g. `1.00001E+18`, which
    // BigInt() rejects; the parser must expand it to a plain integer.
    const sciRow = ROW1.replace('1000003884631745500', '1.00001E+18');
    const table = parseVarjoCsv(crlf(HEADER, sciRow));
    expect(getBigInt(table, 'capture_time')[0]).toBe(1000010000000000000n);
  });

  it('throws on a non-integer CaptureTime token', () => {
    const bad = ROW1.replace('1000003884631745500', 'oops');
    expect(() => parseVarjoCsv(crlf(HEADER, bad))).toThrow(/not an integer/);
  });

  it('parses multiple rows with mixed status', () => {
    const table = parseVarjoCsv(crlf(HEADER, ROW1, ROW2));
    expect(table.numRows).toBe(2);
    expect(getStr(table, 'gaze_status')).toEqual(['VALID', 'INVALID']);
  });

  it('treats empty signal fields in INVALID frames as NaN, not zero', () => {
    // Real exporter behaviour: during INVALID frames the gaze/eye/focus columns
    // (tuples and scalars) are written empty; HMD pose stays populated.
    const invalidRow =
      '725403,1000003885889800900,63875744677244,' +
      '(-0.017, 1.173, 0.042),(0.026, -0.013, 0.029, 0.999),INVALID,' +
      ',,,INVALID,,,,,,,INVALID,,,,,,,,';
    const table = parseVarjoCsv(crlf(HEADER, invalidRow));
    expect(getNum(table, 'hmd_position_y')[0]).toBeCloseTo(1.173); // pose kept
    expect(getNum(table, 'combined_gaze_forward_x')[0]).toBeNaN(); // empty tuple
    expect(getNum(table, 'left_pupil_diameter_mm')[0]).toBeNaN(); // empty scalar
    expect(getNum(table, 'focus_distance')[0]).toBeNaN();
    expect(getStr(table, 'gaze_status')[0]).toBe('INVALID');
  });

  it('strips a UTF-8 BOM', () => {
    const table = parseVarjoCsv('﻿' + crlf(HEADER, ROW1));
    expect(table.numRows).toBe(1);
    expect(getNum(table, 'frame')[0]).toBe(725152);
  });

  it('throws on a header that does not match the source schema', () => {
    const bad = HEADER.replace('FocusStability', 'FocusWobble');
    expect(() => parseVarjoCsv(crlf(bad, ROW1))).toThrow(VarjoParseError);
  });

  it('throws on the wrong number of header columns', () => {
    expect(() => parseVarjoCsv(crlf('Frame,CaptureTime', ROW1))).toThrow(
      /expected 42/,
    );
  });

  it('throws with the row number on a malformed tuple arity', () => {
    const bad = ROW1.replace('(-0.021, -0.034, 0.999)', '(-0.021, -0.034)');
    expect(() => parseVarjoCsv(crlf(HEADER, bad))).toThrow(/row 0/);
  });

  it('throws when a row has the wrong field count', () => {
    expect(() => parseVarjoCsv(crlf(HEADER, ROW1 + ',999'))).toThrow(
      /expected 25 fields/,
    );
  });

  it('tolerates spurious trailing empty fields from extra commas', () => {
    // Observed in the wild: some rows end with extra commas (e.g. `…,0,,,,`).
    const table = parseVarjoCsv(crlf(HEADER, ROW1 + ',,,,'));
    expect(table.numRows).toBe(1);
    expect(getNum(table, 'frame')[0]).toBe(725152);
    expect(getNum(table, 'focus_stability')[0]).toBe(0);
  });

  it('still throws when a beyond-schema trailing field carries data', () => {
    // A non-empty extra field is real layout drift, not a stray comma.
    expect(() => parseVarjoCsv(crlf(HEADER, ROW1 + ',,,7'))).toThrow(
      /expected 25 fields/,
    );
  });
});

describe('parseVarjoCsv on the committed real slice', () => {
  const slicePath = fileURLToPath(
    new URL('../fixtures/ID002_slice.csv', import.meta.url),
  );
  const text = readFileSync(slicePath, 'utf-8');

  it('parses every row of the 400-row fixture', () => {
    const table = parseVarjoCsv(text);
    expect(table.numRows).toBe(400);
    // Real recordings contain INVALID frames — confirm the slice does too.
    const status = getStr(table, 'gaze_status');
    expect(status).toContain('VALID');
    expect(status).toContain('INVALID');
  });
});
