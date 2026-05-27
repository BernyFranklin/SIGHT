import { create } from 'zustand';

import { markersApi } from '@app/api/markers';
import { type Project, projectApi } from '@app/api/project';
import { projectConfigApi } from '@app/api/projectConfig';

interface ProjectState {
  open: Project[];
  activePath: string | null;
  recents: Project[];
  hasMarkers: Record<string, boolean>;
  hasProjectConfig: Record<string, boolean>;
  loadRecents: () => Promise<void>;
  createProject: () => Promise<void>;
  openProject: () => Promise<void>;
  openRecent: (path: string) => Promise<void>;
  refreshMarkers: (path: string) => Promise<void>;
  refreshProjectConfig: (path: string) => Promise<void>;
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
  hasMarkers: {},
  hasProjectConfig: {},

  loadRecents: async () => {
    const recents = await projectApi.listRecent();
    set({ recents });
  },

  createProject: async () => {
    const project = await projectApi.create();
    if (!project) return;
    const recents = await projectApi.listRecent();
    const [hasM, hasPc] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.has(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: hasPc },
    }));
  },

  openProject: async () => {
    const project = await projectApi.open();
    if (!project) return;
    const recents = await projectApi.listRecent();
    const [hasM, hasPc] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.has(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: hasPc },
    }));
  },

  openRecent: async (path) => {
    const project = await projectApi.openRecent(path);
    const recents = await projectApi.listRecent();
    if (!project) {
      set({ recents });
      return;
    }
    const [hasM, hasPc] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.has(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: hasPc },
    }));
  },

  refreshMarkers: async (path) => {
    const has = await markersApi.has(path);
    set((s) => ({ hasMarkers: { ...s.hasMarkers, [path]: has } }));
  },

  refreshProjectConfig: async (path) => {
    const has = await projectConfigApi.has(path);
    set((s) => ({ hasProjectConfig: { ...s.hasProjectConfig, [path]: has } }));
  },

  setActive: (path) => set({ activePath: path }),

  closeActive: () => set((s) => {
    if (!s.activePath) return s;
    const open = s.open.filter((p) => p.path !== s.activePath);
    const activePath = open.length ? open[open.length - 1].path : null;
    return { open, activePath };
  }),
}));
