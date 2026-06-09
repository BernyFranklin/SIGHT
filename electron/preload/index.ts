import { contextBridge, ipcRenderer } from 'electron';

import type { CleaningConfigOverrides, QaReport } from '@cleaning';

import { IpcChannels } from '../ipc';

export interface Project {
  name: string;
  path: string;
}

export interface Marker {
  id: number;
  name: string;
  startFrame: number;
  endFrame: number;
}

export type Fps = 30 | 60;

export interface MarkersFile {
  name: string;
  fps: Fps;
  markers: Marker[];
}

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

export interface PersistedCase {
  id: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  demographics: Record<string, string | number | null>;
}

export interface CasesFile {
  cases: PersistedCase[];
}

const windowControls = {
  minimize: () => ipcRenderer.invoke(IpcChannels.windowMinimize),
  toggleMaximize: () => ipcRenderer.invoke(IpcChannels.windowToggleMaximize),
  close: () => ipcRenderer.invoke(IpcChannels.windowClose),
  toggleDevTools: () => ipcRenderer.invoke(IpcChannels.windowToggleDevTools),
  onMaximizedChanged: (cb: (isMaximized: boolean) => void) => {
    const listener = (_: unknown, isMaximized: boolean) => cb(isMaximized);
    ipcRenderer.on(IpcChannels.windowMaximizedChanged, listener);
    return () => {
      ipcRenderer.off(IpcChannels.windowMaximizedChanged, listener);
    };
  },
};

const project = {
  create: (): Promise<Project | null> =>
    ipcRenderer.invoke(IpcChannels.projectCreate),
  open: (): Promise<Project | null> =>
    ipcRenderer.invoke(IpcChannels.projectOpen),
  openRecent: (path: string): Promise<Project | null> =>
    ipcRenderer.invoke(IpcChannels.projectOpenRecent, path),
  listRecent: (): Promise<Project[]> =>
    ipcRenderer.invoke(IpcChannels.projectListRecent),
};

const markers = {
  read: (projectPath: string): Promise<MarkersFile | null> =>
    ipcRenderer.invoke(IpcChannels.markersRead, projectPath),
  write: (projectPath: string, data: MarkersFile): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.markersWrite, projectPath, data),
  has: (projectPath: string): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.markersHas, projectPath),
};

const projectConfig = {
  read: (projectPath: string): Promise<ProjectConfigFile | null> =>
    ipcRenderer.invoke(IpcChannels.projectConfigRead, projectPath),
  write: (projectPath: string, data: ProjectConfigFile): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.projectConfigWrite, projectPath, data),
  has: (projectPath: string): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.projectConfigHas, projectPath),
};

const cases = {
  read: (projectPath: string): Promise<CasesFile | null> =>
    ipcRenderer.invoke(IpcChannels.casesRead, projectPath),
  write: (projectPath: string, data: CasesFile): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.casesWrite, projectPath, data),
  has: (projectPath: string): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.casesHas, projectPath),
  writeGaze: (
    projectPath: string,
    id: string,
    bytes: ArrayBuffer,
  ): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.casesWriteGaze, projectPath, id, bytes),
  delete: (projectPath: string, id: string): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.casesDelete, projectPath, id),
};

const cleaning = {
  run: (
    projectPath: string,
    id: string,
    overrides?: CleaningConfigOverrides,
  ): Promise<QaReport> =>
    ipcRenderer.invoke(IpcChannels.cleaningRun, projectPath, id, overrides),
  readReport: (projectPath: string, id: string): Promise<QaReport | null> =>
    ipcRenderer.invoke(IpcChannels.cleaningReadReport, projectPath, id),
  hasReport: (projectPath: string, id: string): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.cleaningHasReport, projectPath, id),
};

contextBridge.exposeInMainWorld('api', {
  windowControls,
  project,
  markers,
  projectConfig,
  cases,
  cleaning,
});

export type { CleaningConfigOverrides, QaReport } from '@cleaning';

export type WindowControlsApi = typeof windowControls;
export type ProjectApi = typeof project;
export type MarkersApi = typeof markers;
export type ProjectConfigApi = typeof projectConfig;
export type CasesApi = typeof cases;
export type CleaningApi = typeof cleaning;
