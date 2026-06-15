/**
 * Columnar table used throughout the cleaning pipeline.
 *
 * Recordings can be hundreds of thousands of rows, so signals live in typed
 * arrays (one allocation per column) rather than an array of per-row objects.
 * Missing/nulled numeric values use `NaN`; boolean flags are `Uint8Array` (0/1);
 * the nanosecond clock uses `BigInt64Array` for full precision.
 */

export type ColumnKind = 'num' | 'bigint' | 'str' | 'bool';

export type ColumnData = Float64Array | BigInt64Array | string[] | Uint8Array;

export interface Column {
  readonly kind: ColumnKind;
  readonly data: ColumnData;
}

export interface Table {
  /** Number of rows; every column has exactly this length. */
  numRows: number;
  /** Column names in output (CSV) order. */
  order: string[];
  cols: Map<string, Column>;
}

export function createTable(numRows: number): Table {
  return { numRows, order: [], cols: new Map() };
}

function setColumn(table: Table, name: string, column: Column): void {
  if (column.data.length !== table.numRows) {
    throw new Error(
      `column "${name}" has length ${column.data.length}, expected ${table.numRows}`,
    );
  }
  if (!table.cols.has(name)) table.order.push(name);
  table.cols.set(name, column);
}

export function addNumColumn(
  table: Table,
  name: string,
  data: Float64Array,
): void {
  setColumn(table, name, { kind: 'num', data });
}

export function addBigIntColumn(
  table: Table,
  name: string,
  data: BigInt64Array,
): void {
  setColumn(table, name, { kind: 'bigint', data });
}

export function addStrColumn(table: Table, name: string, data: string[]): void {
  setColumn(table, name, { kind: 'str', data });
}

export function addBoolColumn(
  table: Table,
  name: string,
  data: Uint8Array,
): void {
  setColumn(table, name, { kind: 'bool', data });
}

function require_<T extends Column>(
  table: Table,
  name: string,
  kind: ColumnKind,
): T {
  const col = table.cols.get(name);
  if (!col) throw new Error(`missing column "${name}"`);
  if (col.kind !== kind)
    throw new Error(`column "${name}" is ${col.kind}, expected ${kind}`);
  return col as T;
}

export function getNum(table: Table, name: string): Float64Array {
  return require_<Column>(table, name, 'num').data as Float64Array;
}

export function getBigInt(table: Table, name: string): BigInt64Array {
  return require_<Column>(table, name, 'bigint').data as BigInt64Array;
}

export function getStr(table: Table, name: string): string[] {
  return require_<Column>(table, name, 'str').data as string[];
}

export function getBool(table: Table, name: string): Uint8Array {
  return require_<Column>(table, name, 'bool').data as Uint8Array;
}

export function hasColumn(table: Table, name: string): boolean {
  return table.cols.has(name);
}

/**
 * A view containing only `names`, in the order given. Shares the underlying
 * typed arrays (no copy). Throws if any requested column is absent.
 */
export function selectColumns(table: Table, names: readonly string[]): Table {
  const view = createTable(table.numRows);
  for (const name of names) {
    const col = table.cols.get(name);
    if (!col) throw new Error(`selectColumns: missing column "${name}"`);
    setColumn(view, name, col);
  }
  return view;
}

/** Format a single cell for CSV output. `NaN` → empty string. */
export function formatCell(col: Column, row: number): string {
  switch (col.kind) {
    case 'num': {
      const v = (col.data as Float64Array)[row];
      return Number.isNaN(v) ? '' : String(v);
    }
    case 'bigint':
      return String((col.data as BigInt64Array)[row]);
    case 'bool':
      return (col.data as Uint8Array)[row] ? 'true' : 'false';
    case 'str':
      return (col.data as string[])[row];
  }
}

/** Serialize a table to CSV (header + rows, `\n` line endings). */
export function toCsv(table: Table): string {
  const cols = table.order.map((name) => {
    const col = table.cols.get(name);
    if (!col) throw new Error(`toCsv: missing column "${name}"`);
    return col;
  });
  const lines: string[] = [table.order.join(',')];
  for (let row = 0; row < table.numRows; row++) {
    const cells = new Array<string>(cols.length);
    for (let c = 0; c < cols.length; c++) cells[c] = formatCell(cols[c], row);
    lines.push(cells.join(','));
  }
  return lines.join('\n');
}
