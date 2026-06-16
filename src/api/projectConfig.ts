import type {
  CustomAttribute,
  CustomAttributeType,
  ProjectConfigFile,
} from '@electron/preload';

export type { CustomAttribute, CustomAttributeType, ProjectConfigFile };

export const projectConfigApi = window.api.projectConfig;
