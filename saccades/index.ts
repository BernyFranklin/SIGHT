/**
 * Public API for the saccade-analysis module — the pipeline stage after gaze
 * cleaning. It consumes a cleaned saccade-view CSV and produces the per-frame
 * series, per-saccade table, and summary report that the planned visuals
 * (trajectory, velocity profile, main-sequence scatter, amplitude histogram)
 * are rendered from.
 */

export {
  angularDisplacementDeg,
  angularVelocityDegPerSec,
  computeAngularVelocitiesDegPerSec,
  type Vec3,
} from './core/velocities';
export {
  DEFAULT_SACCADE_OPTIONS,
  DEFAULT_SAMPLING_RATE_HZ,
  type SaccadeDetectionOptions,
  type SaccadeEvent,
  type SaccadeEventExtended,
} from './core/schema';
export {
  detectSaccadesFromVectors,
  type DetectSaccadeResult,
} from './core/detection';
export {
  computeDistributionStats,
  EMPTY_DISTRIBUTION_STATS,
  type DistributionStats,
} from './metrics/stats';
export {
  parseSaccadeView,
  type SaccadeIngestDiagnostics,
  type SaccadeViewIngest,
} from './ingest/parseSaccadeView';
export { buildSaccadeReport, type SaccadeReport } from './report';
export {
  runSaccadeAnalysis,
  runSaccadeAnalysisText,
  type PerSaccadeRow,
  type SaccadeAnalysisOptions,
  type SaccadeFrame,
  type SaccadeResult,
} from './pipeline/runSaccadeAnalysis';
export {
  framesToCsv,
  saccadesToCsv,
  writeSaccadeOutputs,
  type WrittenSaccadeOutputs,
} from './outputs/saccadeBundle';
