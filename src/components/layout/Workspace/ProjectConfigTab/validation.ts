import type { ProjectConfig, ProjectConfigKey } from './types';

export type FieldErrors = Partial<Record<ProjectConfigKey, string>>;
export type FieldWarnings = Partial<Record<ProjectConfigKey, string>>;

type Pair = {
  minKey: ProjectConfigKey;
  maxKey: ProjectConfigKey;
  label: string;
};

const ORDERED_PAIRS: Pair[] = [
  { minKey: 'saccade_min_velocity', maxKey: 'saccade_max_velocity', label: 'Saccade velocity' },
  { minKey: 'saccade_min_duration', maxKey: 'saccade_max_duration', label: 'Saccade duration' },
  { minKey: 'saccade_min_amplitude', maxKey: 'saccade_max_amplitude', label: 'Saccade amplitude' },
  { minKey: 'pupil_min_diameter', maxKey: 'pupil_max_diameter', label: 'Pupil diameter' },
  { minKey: 'focus_min_distance', maxKey: 'focus_max_distance', label: 'Focus distance' },
];

export function validate(config: ProjectConfig): { errors: FieldErrors; warnings: FieldWarnings } {
  const errors: FieldErrors = {};
  const warnings: FieldWarnings = {};

  for (const { minKey, maxKey, label } of ORDERED_PAIRS) {
    const minV = config[minKey] as number;
    const maxV = config[maxKey] as number;
    if (Number.isFinite(minV) && Number.isFinite(maxV) && minV >= maxV) {
      const msg = `${label}: min must be less than max.`;
      errors[minKey] = msg;
      errors[maxKey] = msg;
    }
  }

  if (
    Number.isFinite(config.pupil_baseline_window)
    && Number.isFinite(config.epoch_pre_stimulus_window)
    && config.pupil_baseline_window > config.epoch_pre_stimulus_window
  ) {
    const msg = 'Baseline window should not exceed the pre-stimulus epoch window.';
    warnings.pupil_baseline_window = msg;
    warnings.epoch_pre_stimulus_window = msg;
  }

  return { errors, warnings };
}
