import { create } from 'zustand';

import { type Project, projectApi } from '@app/api/project';

interface ProjectState {
  current: Project | null;
  recents: Project[];
  loadRecents: () => Promise<void>;
  createProject: () => Promise<void>;
  openProject: () => Promise<void>;
  openRecent: (path: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  current: null,
  recents: [],

  loadRecents: async () => {
    const recents = await projectApi.listRecent();
    set({ recents });
  },

  createProject: async () => {
    const project = await projectApi.create();
    if (!project) return;
    const recents = await projectApi.listRecent();
    set({ current: project, recents });
  },

  openProject: async () => {
    const project = await projectApi.open();
    if (!project) return;
    const recents = await projectApi.listRecent();
    set({ current: project, recents });
  },

  openRecent: async (path) => {
    const project = await projectApi.openRecent(path);
    const recents = await projectApi.listRecent();
    if (!project) {
      set({ recents });
      return;
    }
    set({ current: project, recents });
  },
}));
