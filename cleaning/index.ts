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
export { deriveColumns } from './core/deriveColumns';
export { flagInvalidRuns } from './core/invalidRuns';
export { computeFlags } from './core/flags';
export { flagExcluded } from './core/excluded';
export { interpolatePupils } from './core/interpolate';
export { buildViews, type CleanViews } from './views/buildViews';
export {
  buildReport,
  reportToMarkdown,
  type QaReport,
  type ReportMeta,
} from './qa/buildReport';
export {
  cleanRecording,
  cleanRecordingText,
  cleanTable,
  type CleanResult,
} from './pipeline/cleanRecording';
