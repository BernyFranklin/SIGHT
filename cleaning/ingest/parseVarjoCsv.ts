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
        case 'bigint': {
          const t = token.trim();
          if (t === '')
            throw new VarjoParseError(
              `row ${row}: timestamp column "${target.name}" is empty`,
            );
          target.arr[row] = BigInt(t);
          break;
        }
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
