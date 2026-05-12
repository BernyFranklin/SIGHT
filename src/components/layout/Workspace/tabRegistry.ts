import type { ComponentType } from 'react';

import type { Tab, TabKind } from '@app/store/useWorkspaceStore';

import { MarkerConfigTab } from './MarkerConfigTab';
import { ProjectConfigTab } from './ProjectConfigTab';
import { WelcomeTab } from './WelcomeTab';

export type TabComponentProps = { tab: Tab };

export const tabRegistry: Record<TabKind, ComponentType<TabComponentProps>> = {
  welcome: WelcomeTab,
  'marker-config': MarkerConfigTab,
  'project-config': ProjectConfigTab,
};
