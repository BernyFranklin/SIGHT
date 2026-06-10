import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type CustomAttributeType = 'number' | 'text' | 'dropdown';

export interface CustomAttribute {
  id: string;
  label: string;
  type: CustomAttributeType;
  options: string[];
}

export interface ProjectConfigFile {
  project_description: string;

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

  fixation_min_duration: number;
  fixation_max_dispersion: number;
  fixation_algorithm: string;

  pupil_baseline_window: number;
  pupil_baseline_correction_method: string;
  pupil_blink_interpolation_method: string;
  pupil_blink_max_gap: number;
  pupil_min_diameter: number;
  pupil_max_diameter: number;
  pupil_lr_asymmetry_tolerance: number;

  quality_min_valid_frame_ratio: number;
  quality_max_consecutive_invalid: number;
  quality_eye_openness_threshold: number;

  epoch_pre_stimulus_window: number;
  epoch_post_stimulus_window: number;
  epoch_artifact_sd_threshold: number;
  epoch_artifact_max_ratio: number;

  focus_min_distance: number;
  focus_max_distance: number;
  focus_min_stability: number;

  demographics_age_enabled: boolean;
  demographics_age: number | null;
  demographics_gender_enabled: boolean;
  demographics_gender: string;
  demographics_gender_other: string;
  demographics_asrs_enabled: boolean;
  demographics_asrs_inattention: number | null;
  demographics_asrs_hyperactivity: number | null;
  demographics_custom_attributes: CustomAttribute[];
}

const SIGHT_DIR = '.sight';
const PROJECT_CONFIG_FILE = 'project-config.json';

function projectConfigPath(projectPath: string): string {
  return path.join(projectPath, SIGHT_DIR, PROJECT_CONFIG_FILE);
}

export function hasProjectConfig(projectPath: string): boolean {
  return existsSync(projectConfigPath(projectPath));
}

export async function readProjectConfig(
  projectPath: string,
): Promise<ProjectConfigFile | null> {
  const file = projectConfigPath(projectPath);
  if (!existsSync(file)) return null;
  try {
    const raw = await readFile(file, 'utf-8');
    return JSON.parse(raw) as ProjectConfigFile;
  } catch (err) {
    console.error(
      '[projectConfigService] failed to read project-config.json',
      err,
    );
    return null;
  }
}

export async function writeProjectConfig(
  projectPath: string,
  data: ProjectConfigFile,
): Promise<void> {
  const dir = path.join(projectPath, SIGHT_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, PROJECT_CONFIG_FILE),
    JSON.stringify(data, null, 2),
    'utf-8',
  );
}
