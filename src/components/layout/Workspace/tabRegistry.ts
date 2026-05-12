import type { ComponentType } from 'react';

import type { TabKind } from '@app/store/useWorkspaceStore';

import { WelcomeTab } from './WelcomeTab';

export const tabRegistry: Record<TabKind, ComponentType> = {
  welcome: WelcomeTab,
};
