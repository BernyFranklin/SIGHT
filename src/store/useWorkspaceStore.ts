import { create } from 'zustand';

export type TabKind = 'welcome' | 'marker-config' | 'project-config' | 'new-case' | 'case';

export interface Tab {
  id: string;
  title: string;
  kind: TabKind;
  closable: boolean;
  projectPath?: string;
  /** For 'case' tabs: the CaseRecord.id this tab displays. */
  caseRecordId?: string;
}

interface WorkspaceState {
  tabs: Tab[];
  activeId: string | null;
  openTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
}

const welcomeTab: Tab = {
  id: 'welcome',
  title: 'Welcome!',
  kind: 'welcome',
  closable: true,
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  tabs: [welcomeTab],
  activeId: welcomeTab.id,
  openTab: (tab) =>
    set((state) => {
      if (state.tabs.some((t) => t.id === tab.id)) {
        return { activeId: tab.id };
      }
      return { tabs: [...state.tabs, tab], activeId: tab.id };
    }),
  closeTab: (id) =>
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id);
      let activeId = state.activeId;
      if (activeId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id);
        activeId = tabs[idx]?.id ?? tabs[idx - 1]?.id ?? tabs[0]?.id ?? null;
      }
      return { tabs, activeId };
    }),
  setActive: (id) => set({ activeId: id }),
}));
