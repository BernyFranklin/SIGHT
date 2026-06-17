/**
 * Tuple-aware reader for raw Varjo XR4 gaze exports.
 *
 * Handles the file's defining quirk: several columns are parenthesized tuples
 * whose internal commas are not field separators. We tokenize each row on commas
 * *outside* parentheses, then expand tuples into scalar columns per
 * {@link RAW_LAYOUT}, validating arity at every step and failing loudly with the
 * offending row number.
 */

import { readFile } from 'node:fs/promises';

import {
  addBigIntColumn,
  addNumColumn,
  addStrColumn,
  createTable,
  type Table,
} from '../frame';
import { FLAT_COLUMNS, RAW_LAYOUT, SOURCE_COLUMNS } from '../schema';

/** Raised on any structural problem in the raw CSV. */
export class VarjoParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VarjoParseError';
  }
}

const OPEN_PAREN = 40; // (
const CLOSE_PAREN = 41; // )
const COMMA = 44; // ,

/**
 * Split a raw line on commas that sit outside parentheses, so tuple groups like
 * `(0.000, 0.000, 0.000)` stay intact as a single token.
 */
export function tokenizeLine(line: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line.charCodeAt(i);
    if (c === OPEN_PAREN) depth++;
    else if (c === CLOSE_PAREN) depth--;
    else if (c === COMMA && depth === 0) {
      tokens.push(line.slice(start, i));
      start = i + 1;
    }
  }
  tokens.push(line.slice(start));
  return tokens;
}

/** Strip the surrounding parens of a tuple token and return its inner scalars. */
function tupleValues(
  token: string,
  arity: number,
  row: number,
  field: number,
): string[] {
  const trimmed = token.trim();
  if (
    trimmed.charCodeAt(0) !== OPEN_PAREN ||
    trimmed.charCodeAt(trimmed.length - 1) !== CLOSE_PAREN
  ) {
    throw new VarjoParseError(
      `row ${row}, field ${field}: expected a ${arity}-tuple, got "${token}"`,
    );
  }
  const parts = trimmed.slice(1, -1).split(',');
  if (parts.length !== arity) {
    throw new VarjoParseError(
      `row ${row}, field ${field}: expected ${arity} tuple values, got ${parts.length} in "${token}"`,
    );
  }
  return parts;
}

/**
 * Parse a numeric cell. Empty cells (how the exporter writes signals during
 * INVALID frames) and explicit `NaN` become `NaN` — missing, not zero. Note
 * `Number('')` is 0, so the empty check is load-bearing.
 */
function parseNum(value: string, row: number, name: string): number {
  const t = value.trim();
  if (t === '') return NaN;
  const n = Number(t);
  if (Number.isNaN(n) && t.toLowerCase() !== 'nan') {
    throw new VarjoParseError(
      `row ${row}: column "${name}" is not numeric: "${value}"`,
    );
  }
  return n;
}

/**
 * Parse a nanosecond timestamp token into a BigInt. The exporter usually writes
 * a plain integer, but some rows arrive in scientific or decimal notation (e.g.
 * `1.00001E+18`) which `BigInt()` rejects outright. Expand the mantissa and
 * exponent into an integer literal by hand so those rows load instead of
 * crashing the whole run. Any fractional remainder is truncated toward zero —
 * scientific notation has already discarded sub-significant-digit precision in
 * the file itself, so there is nothing finer to preserve.
 */
function parseTimestamp(value: string, row: number, name: string): bigint {
  const t = value.trim();
  if (t === '')
    throw new VarjoParseError(
      `row ${row}: timestamp column "${name}" is empty`,
    );
  if (/^[+-]?\d+$/.test(t)) return BigInt(t);

  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(t);
  if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) {
    throw new VarjoParseError(
      `row ${row}: timestamp column "${name}" is not an integer: "${value}"`,
    );
  }
  const sign = m[1] === '-' ? '-' : '';
  const fracPart = m[3] ?? '';
  const digits = (m[2] ?? '') + fracPart;
  const shift = (m[4] ? parseInt(m[4], 10) : 0) - fracPart.length;

  let out: string;
  if (shift >= 0) {
    out = digits + '0'.repeat(shift);
  } else {
    const keep = digits.length + shift;
    out = keep > 0 ? digits.slice(0, keep) : '0';
  }
  out = out.replace(/^0+(?=\d)/, '');
  return BigInt(`${sign}${out === '' ? '0' : out}`);
}

/** Normalize raw CSV text into lines, stripping a BOM and trailing blank line. */
function splitLines(text: string): string[] {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = clean.split(/\r\n|\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function validateHeader(headerLine: string): void {
  const names = headerLine.split(',');
  if (names.length !== SOURCE_COLUMNS.length) {
    throw new VarjoParseError(
      `header has ${names.length} columns, expected ${SOURCE_COLUMNS.length}`,
    );
  }
  for (let i = 0; i < names.length; i++) {
    if (names[i] !== SOURCE_COLUMNS[i]) {
      throw new VarjoParseError(
        `header column ${i} is "${names[i]}", expected "${SOURCE_COLUMNS[i]}"`,
      );
    }
  }
}

/**
 * Parse raw Varjo CSV text into a columnar {@link Table} keyed by clean
 * snake_case names. Pure and synchronous for easy testing; use
 * {@link readVarjoCsv} to read from disk.
 */
export function parseVarjoCsv(text: string): Table {
  const lines = splitLines(text);
  if (lines.length === 0) throw new VarjoParseError('empty file');
  validateHeader(lines[0]);

  const numRows = lines.length - 1;
  const table = createTable(numRows);

  // Pre-allocate one typed array per flat output column, and resolve each raw
  // field to its target array(s) up front so the hot row loop indexes directly.
  const numCols = new Map<string, Float64Array>();
  const strCols = new Map<string, string[]>();
  const bigCols = new Map<string, BigInt64Array>();

  type FieldTarget =
    | { type: 'num'; name: string; arr: Float64Array }
    | { type: 'bigint'; name: string; arr: BigInt64Array }
    | { type: 'str'; arr: string[] }
    | { type: 'tuple'; names: readonly string[]; arrs: Float64Array[] };

  const targets: FieldTarget[] = RAW_LAYOUT.map((spec) => {
    if (spec.type === 'str') {
      const arr = new Array<string>(numRows);
      strCols.set(spec.outs[0], arr);
      return { type: 'str', arr };
    }
    if (spec.type === 'bigint') {
      const arr = new BigInt64Array(numRows);
      bigCols.set(spec.outs[0], arr);
      return { type: 'bigint', name: spec.outs[0], arr };
    }
    const arrs = spec.outs.map((name) => {
      const arr = new Float64Array(numRows);
      numCols.set(name, arr);
      return arr;
    });
    return spec.outs.length === 1
      ? { type: 'num', name: spec.outs[0], arr: arrs[0] }
      : { type: 'tuple', names: spec.outs, arrs };
  });

  for (let row = 0; row < numRows; row++) {
    const line = lines[row + 1];
    const tokens = tokenizeLine(line);
    // Some exports append spurious trailing empty fields (extra commas at the
    // end of a row). Drop those, but only when empty — any beyond-schema field
    // that actually carries data is real layout drift and must still fail loudly.
    while (
      tokens.length > RAW_LAYOUT.length &&
      tokens[tokens.length - 1].trim() === ''
    ) {
      tokens.pop();
    }
    if (tokens.length !== RAW_LAYOUT.length) {
      throw new VarjoParseError(
        `row ${row}: expected ${RAW_LAYOUT.length} fields, got ${tokens.length}`,
      );
    }
    for (let f = 0; f < targets.length; f++) {
      const target = targets[f];
      const token = tokens[f];
      switch (target.type) {
        case 'num':
          target.arr[row] = parseNum(token, row, target.name);
          break;
        case 'str':
          target.arr[row] = token.trim();
          break;
        case 'bigint':
          target.arr[row] = parseTimestamp(token, row, target.name);
          break;
        case 'tuple': {
          if (token.trim() === '') {
            // INVALID frames write tuple signals as empty fields — treat as missing.
            for (const arr of target.arrs) arr[row] = NaN;
          } else {
            const values = tupleValues(token, target.arrs.length, row, f);
            for (let k = 0; k < target.arrs.length; k++) {
              target.arrs[k][row] = parseNum(values[k], row, target.names[k]);
            }
          }
          break;
        }
      }
    }
  }

  // Assemble in canonical source order.
  for (const name of FLAT_COLUMNS) {
    const num = numCols.get(name);
    if (num) {
      addNumColumn(table, name, num);
      continue;
    }
    const str = strCols.get(name);
    if (str) {
      addStrColumn(table, name, str);
      continue;
    }
    const big = bigCols.get(name);
    if (big) {
      addBigIntColumn(table, name, big);
      continue;
    }
    throw new VarjoParseError(`internal: no column allocated for "${name}"`);
  }
  return table;
}

/** Read and parse a raw Varjo CSV file from disk. */
export async function readVarjoCsv(path: string): Promise<Table> {
  const text = await readFile(path, 'utf-8');
  return parseVarjoCsv(text);
}
