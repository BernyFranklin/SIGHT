import type { ComponentType } from 'react';

import type { Tab, TabKind } from '@app/store/useWorkspaceStore';

import { CaseTab } from './CaseTab';
import { MarkerConfigTab } from './MarkerConfigTab';
import { NewCaseTab } from './NewCaseTab';
import { ProjectConfigTab } from './ProjectConfigTab';
import { WelcomeTab } from './WelcomeTab';

export type TabComponentProps = { tab: Tab };

export const tabRegistry: Record<TabKind, ComponentType<TabComponentProps>> = {
  welcome: WelcomeTab,
  'marker-config': MarkerConfigTab,
  'project-config': ProjectConfigTab,
  'new-case': NewCaseTab,
  case: CaseTab,
};
