import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

import { tabRegistry } from './tabRegistry';

export function TabContent() {
  const activeId = useWorkspaceStore((s) => s.activeId);
  const tabs = useWorkspaceStore((s) => s.tabs);
  const active = tabs.find((t) => t.id === activeId);
  if (!active) return null;
  const Component = tabRegistry[active.kind];
  return <Component tab={active} />;
}
