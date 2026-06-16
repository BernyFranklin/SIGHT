import { MAX_CUSTOM_ATTRIBUTES } from './constants';
import type { ProjectConfig, ProjectConfigKey } from './types';

export type FieldErrors = Partial<Record<ProjectConfigKey, string>>;
export type FieldWarnings = Partial<Record<ProjectConfigKey, string>>;
export type CustomAttributeErrors = Record<
  string,
  { label?: string; options?: string }
>;

type Pair = {
  minKey: ProjectConfigKey;
  maxKey: ProjectConfigKey;
  label: string;
};

const ORDERED_PAIRS: Pair[] = [
  {
    minKey: 'saccade_min_velocity',
    maxKey: 'saccade_max_velocity',
    label: 'Saccade velocity',
  },
  {
    minKey: 'saccade_min_duration',
    maxKey: 'saccade_max_duration',
    label: 'Saccade duration',
  },
  {
    minKey: 'saccade_min_amplitude',
    maxKey: 'saccade_max_amplitude',
    label: 'Saccade amplitude',
  },
  {
    minKey: 'pupil_min_diameter',
    maxKey: 'pupil_max_diameter',
    label: 'Pupil diameter',
  },
  {
    minKey: 'focus_min_distance',
    maxKey: 'focus_max_distance',
    label: 'Focus distance',
  },
];

export function validate(config: ProjectConfig): {
  errors: FieldErrors;
  warnings: FieldWarnings;
  customAttributeErrors: CustomAttributeErrors;
} {
  const errors: FieldErrors = {};
  const warnings: FieldWarnings = {};
  const customAttributeErrors: CustomAttributeErrors = {};

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
    Number.isFinite(config.pupil_baseline_window) &&
    Number.isFinite(config.epoch_pre_stimulus_window) &&
    config.pupil_baseline_window > config.epoch_pre_stimulus_window
  ) {
    const msg =
      'Baseline window should not exceed the pre-stimulus epoch window.';
    warnings.pupil_baseline_window = msg;
    warnings.epoch_pre_stimulus_window = msg;
  }

  validateIntInRange(
    config.demographics_age_enabled,
    config.demographics_age,
    'demographics_age',
    5,
    120,
    'Age',
    errors,
  );

  if (config.demographics_gender_enabled) {
    if (!config.demographics_gender) {
      errors.demographics_gender = 'Gender is required.';
    } else if (
      config.demographics_gender === 'Other' &&
      !config.demographics_gender_other.trim()
    ) {
      errors.demographics_gender_other = 'Please specify.';
    }
  }

  validateIntInRange(
    config.demographics_asrs_enabled,
    config.demographics_asrs_inattention,
    'demographics_asrs_inattention',
    0,
    36,
    'Inattention',
    errors,
  );
  validateIntInRange(
    config.demographics_asrs_enabled,
    config.demographics_asrs_hyperactivity,
    'demographics_asrs_hyperactivity',
    0,
    36,
    'Hyperactivity',
    errors,
  );

  const attrs = config.demographics_custom_attributes;
  const labelCounts = new Map<string, number>();
  for (const a of attrs) {
    const key = a.label.trim().toLowerCase();
    if (key) labelCounts.set(key, (labelCounts.get(key) ?? 0) + 1);
  }
  for (const a of attrs) {
    const labelTrimmed = a.label.trim();
    const labelKey = labelTrimmed.toLowerCase();
    let labelErr: string | undefined;
    let optionsErr: string | undefined;
    if (!labelTrimmed) {
      labelErr = 'Label is required.';
    } else if ((labelCounts.get(labelKey) ?? 0) > 1) {
      labelErr = 'Label must be unique.';
    }
    if (a.type === 'dropdown' && a.options.length < 2) {
      optionsErr = 'At least 2 options are required.';
    }
    if (labelErr || optionsErr) {
      customAttributeErrors[a.id] = { label: labelErr, options: optionsErr };
    }
  }
  if (attrs.length > MAX_CUSTOM_ATTRIBUTES) {
    // Defensive: builder UI prevents this, but flag it on the last over-limit row.
    const overflow = attrs[MAX_CUSTOM_ATTRIBUTES];
    if (overflow) {
      customAttributeErrors[overflow.id] = {
        ...customAttributeErrors[overflow.id],
        label: `Maximum ${MAX_CUSTOM_ATTRIBUTES} attributes.`,
      };
    }
  }

  return { errors, warnings, customAttributeErrors };
}

function validateIntInRange(
  enabled: boolean,
  value: number | null,
  key: ProjectConfigKey,
  min: number,
  max: number,
  label: string,
  errors: FieldErrors,
) {
  if (!enabled) return;
  if (value == null) {
    errors[key] = `${label} is required.`;
    return;
  }
  if (!Number.isInteger(value)) {
    errors[key] = `${label} must be a whole number.`;
    return;
  }
  if (value < min || value > max) {
    errors[key] = `${label} must be between ${min} and ${max}.`;
  }
}
