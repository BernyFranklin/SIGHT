/**
 * Public API for the gaze cleaning module — the first pipeline stage that turns
 * a raw Varjo XR4 export into clean, validated, flagged outputs for the
 * downstream Saccade, Pupillometry, and Gaze Quality modules.
 */

export * from './schema';
export * from './frame';
export * from './config';
export {
  parseVarjoCsv,
  readVarjoCsv,
  tokenizeLine,
  VarjoParseError,
} from './ingest/parseVarjoCsv';
