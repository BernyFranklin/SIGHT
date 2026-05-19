export type Status = 'new' | 'dirty' | 'clean';

export type FixationAlgorithm = 'I-VT' | 'I-DT';

export type PupilBaselineCorrection = 'subtraction' | 'percent_change' | 'z_score';

export type PupilBlinkInterpolation = 'linear' | 'cubic_spline' | 'none';

export type CustomAttributeType = 'number' | 'text' | 'dropdown';

export type CustomAttribute = {
  id: string;
  label: string;
  type: CustomAttributeType;
  options: string[];
};

export type ProjectConfig = {
  // Group 0: Project Info
  project_description: string;

  // Group 1: Saccade Detection
  saccade_min_velocity: number;
  saccade_max_velocity: number;
  saccade_min_duration: number;
  saccade_max_duration: number;
  saccade_min_amplitude: number;
  saccade_max_amplitude: number;
  saccade_refractory_period: number;
  saccade_inter_saccadic_interval: number;
  saccade_max_gap_for_velocity: number;
  saccade_direction_filter_enabled: boolean;
  saccade_direction_filter_angle: number;
  saccade_direction_filter_tolerance: number;

  // Group 2: Fixation Detection
  fixation_min_duration: number;
  fixation_max_dispersion: number;
  fixation_algorithm: FixationAlgorithm;

  // Group 3: Pupillometry
  pupil_baseline_window: number;
  pupil_baseline_correction_method: PupilBaselineCorrection;
  pupil_blink_interpolation_method: PupilBlinkInterpolation;
  pupil_blink_max_gap: number;
  pupil_min_diameter: number;
  pupil_max_diameter: number;
  pupil_lr_asymmetry_tolerance: number;

  // Group 4: Gaze Quality & Data Integrity
  quality_min_valid_frame_ratio: number;
  quality_max_consecutive_invalid: number;
  quality_eye_openness_threshold: number;

  // Group 5: Epoch / Event-Locking
  epoch_pre_stimulus_window: number;
  epoch_post_stimulus_window: number;
  epoch_artifact_sd_threshold: number;
  epoch_artifact_max_ratio: number;

  // Group 6: Focus & Vergence
  focus_min_distance: number;
  focus_max_distance: number;
  focus_min_stability: number;

  // Group 7: Demographic & Clinical Metadata
  demographics_age_enabled: boolean;
  demographics_age: number | null;
  demographics_gender_enabled: boolean;
  demographics_gender: string;
  demographics_gender_other: string;
  demographics_asrs_enabled: boolean;
  demographics_asrs_inattention: number | null;
  demographics_asrs_hyperactivity: number | null;
  demographics_custom_attributes: CustomAttribute[];
};

export type ProjectConfigKey = keyof ProjectConfig;

export type InputType =
  | 'text-area'
  | 'number-input'
  | 'range-slider'
  | 'range-pair'
  | 'radio-group'
  | 'toggle-switch'
  | 'dropdown'
  | 'read-only';

export type RadioOption<T extends string = string> = {
  value: T;
  label: string;
};

type BaseSpec<K extends ProjectConfigKey> = {
  key: K;
  label: string;
  units?: string;
};

export type TextAreaSpec<K extends ProjectConfigKey = ProjectConfigKey> = BaseSpec<K> & {
  type: 'text-area';
  default: string;
  maxLength: number;
  rows?: number;
  placeholder?: string;
};

export type NumberInputSpec<K extends ProjectConfigKey = ProjectConfigKey> = BaseSpec<K> & {
  type: 'number-input';
  default: number;
  min: number;
  max: number;
  step: number;
};

export type RangeSliderSpec<K extends ProjectConfigKey = ProjectConfigKey> = BaseSpec<K> & {
  type: 'range-slider';
  default: number;
  min: number;
  max: number;
  step: number;
  /** Number of decimals to display in live readout. */
  decimals?: number;
};

export type RangePairSpec = {
  type: 'range-pair';
  label: string;
  units?: string;
  minKey: ProjectConfigKey;
  maxKey: ProjectConfigKey;
  minBounds: { min: number; max: number };
  maxBounds: { min: number; max: number };
  step: number;
  decimals?: number;
};

export type RadioGroupSpec<K extends ProjectConfigKey = ProjectConfigKey> = BaseSpec<K> & {
  type: 'radio-group';
  default: string;
  options: RadioOption[];
};

export type ToggleSwitchSpec<K extends ProjectConfigKey = ProjectConfigKey> = BaseSpec<K> & {
  type: 'toggle-switch';
  default: boolean;
};

export type DropdownOption = {
  value: string;
  label: string;
};

export type DropdownSpec<K extends ProjectConfigKey = ProjectConfigKey> = BaseSpec<K> & {
  type: 'dropdown';
  default: string;
  options: DropdownOption[];
  placeholder?: string;
  /** When set, selecting this value reveals a free-text field bound to `otherKey`. */
  otherTrigger?: { value: string; otherKey: ProjectConfigKey; placeholder?: string; maxLength?: number };
};

export type ReadOnlySpec = {
  type: 'read-only';
  label: string;
  units?: string;
  compute: (config: ProjectConfig) => string | null;
};

/** When the dependent key matches `equals`, this field is shown/enabled; otherwise hidden or dimmed. */
export type DependencyRule = {
  key: ProjectConfigKey;
  equals: unknown;
  /** 'hidden' fully removes; 'dimmed' shows disabled with reduced opacity. */
  mode: 'hidden' | 'dimmed';
};

export type FieldSpec =
  | (TextAreaSpec & { dependsOn?: DependencyRule })
  | (NumberInputSpec & { dependsOn?: DependencyRule })
  | (RangeSliderSpec & { dependsOn?: DependencyRule })
  | (RangePairSpec & { dependsOn?: DependencyRule })
  | (RadioGroupSpec & { dependsOn?: DependencyRule })
  | (ToggleSwitchSpec & { dependsOn?: DependencyRule })
  | (DropdownSpec & { dependsOn?: DependencyRule })
  | (ReadOnlySpec & { dependsOn?: DependencyRule });

export type GroupSpec = {
  id: string;
  title: string;
  fields: FieldSpec[];
};
