import type { ComponentType } from 'react';

import type { TabKind } from '@app/store/useWorkspaceStore';

import { MarkerConfigTab } from './MarkerConfigTab';
import { ProjectConfigTab } from './ProjectConfigTab';
import { WelcomeTab } from './WelcomeTab';

export const tabRegistry: Record<TabKind, ComponentType> = {
  welcome: WelcomeTab,
  'marker-config': MarkerConfigTab,
  'project-config': ProjectConfigTab,
};
