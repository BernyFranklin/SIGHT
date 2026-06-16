/**
 * Distribution summary for a set of per-saccade values (amplitude, peak
 * velocity, duration). Deterministic percentiles via rounded nearest-rank so
 * results are stable across runs and platforms.
 *
 * Ported from the EyeDHD pipeline (`saccades/metrics/stats.ts`).
 */

export interface DistributionStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p10: number;
  p50: number;
  p90: number;
  std: number;
}

export const EMPTY_DISTRIBUTION_STATS: DistributionStats = {
  min: 0,
  max: 0,
  mean: 0,
  median: 0,
  p10: 0,
  p50: 0,
  p90: 0,
  std: 0,
};

/** Nearest-rank percentile with a rounded, clamped index. Assumes sorted input. */
function percentileRounded(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const idx = Math.round(p * (n - 1));
  return sorted[Math.min(n - 1, Math.max(0, idx))];
}

/** Median of a sorted array. */
function medianSorted(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Population standard deviation (n in the denominator). */
function populationStd(values: number[], mean: number): number {
  const n = values.length;
  if (n <= 1) return 0;
  let sumSq = 0;
  for (const x of values) {
    const d = x - mean;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / n);
}

/** Summarize the finite values in `values`; all-zero stats for an empty set. */
export function computeDistributionStats(values: number[]): DistributionStats {
  const finite = values.filter(Number.isFinite);
  const n = finite.length;
  if (n === 0) return { ...EMPTY_DISTRIBUTION_STATS };

  const sorted = [...finite].sort((a, b) => a - b);
  let sum = 0;
  for (const x of sorted) sum += x;
  const mean = sum / n;
  const median = medianSorted(sorted);

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median,
    p10: percentileRounded(sorted, 0.1),
    p50: median,
    p90: percentileRounded(sorted, 0.9),
    std: populationStd(sorted, mean),
  };
}
