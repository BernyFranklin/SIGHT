import { create } from 'zustand';

import { type Project, projectApi } from '@app/api/project';

interface ProjectState {
  open: Project[];
  activePath: string | null;
  recents: Project[];
  loadRecents: () => Promise<void>;
  createProject: () => Promise<void>;
  openProject: () => Promise<void>;
  openRecent: (path: string) => Promise<void>;
  setActive: (path: string) => void;
  closeActive: () => void;
}

const addOpen = (open: Project[], project: Project): Project[] => {
  if (open.some((p) => p.path === project.path)) return open;
  return [...open, project];
};

export const useProjectStore = create<ProjectState>((set) => ({
  open: [],
  activePath: null,
  recents: [],

  loadRecents: async () => {
    const recents = await projectApi.listRecent();
    set({ recents });
  },

  createProject: async () => {
    const project = await projectApi.create();
    if (!project) return;
    const recents = await projectApi.listRecent();
    set((s) => ({ open: addOpen(s.open, project), activePath: project.path, recents }));
  },

  openProject: async () => {
    const project = await projectApi.open();
    if (!project) return;
    const recents = await projectApi.listRecent();
    set((s) => ({ open: addOpen(s.open, project), activePath: project.path, recents }));
  },

  openRecent: async (path) => {
    const project = await projectApi.openRecent(path);
    const recents = await projectApi.listRecent();
    if (!project) {
      set({ recents });
      return;
    }
    set((s) => ({ open: addOpen(s.open, project), activePath: project.path, recents }));
  },

  setActive: (path) => set({ activePath: path }),

  closeActive: () => set((s) => {
    if (!s.activePath) return s;
    const open = s.open.filter((p) => p.path !== s.activePath);
    const activePath = open.length ? open[open.length - 1].path : null;
    return { open, activePath };
  }),
}));
