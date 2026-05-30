import { create } from 'zustand';

import { markersApi } from '@app/api/markers';
import { type Project, projectApi } from '@app/api/project';
import { type ProjectConfigFile, projectConfigApi } from '@app/api/projectConfig';
import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

/**
 * A research subject within a project. Held in memory only (no disk persistence):
 * the raw gaze file is a live `File` reference and `demographics` is a schema-keyed
 * value map. Missing/null entries are what flag a case as "incomplete" when the
 * project's demographic schema gains fields after the case was created.
 */
export interface CaseRecord {
  id: string;
  caseId: string;
  file: File;
  demographics: Record<string, string | number | null>;
}

interface ProjectState {
  open: Project[];
  activePath: string | null;
  recents: Project[];
  hasMarkers: Record<string, boolean>;
  hasProjectConfig: Record<string, boolean>;
  projectConfigs: Record<string, ProjectConfigFile | null>;
  cases: Record<string, CaseRecord[]>;
  loadRecents: () => Promise<void>;
  createProject: () => Promise<void>;
  openProject: () => Promise<void>;
  openRecent: (path: string) => Promise<void>;
  refreshMarkers: (path: string) => Promise<void>;
  refreshProjectConfig: (path: string) => Promise<void>;
  addCase: (path: string, record: CaseRecord) => void;
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
  projectConfigs: {},
  cases: {},

  loadRecents: async () => {
    const recents = await projectApi.listRecent();
    set({ recents });
  },

  createProject: async () => {
    const project = await projectApi.create();
    if (!project) return;
    const recents = await projectApi.listRecent();
    const [hasM, config] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.read(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: config != null },
      projectConfigs: { ...s.projectConfigs, [project.path]: config },
    }));
  },

  openProject: async () => {
    const project = await projectApi.open();
    if (!project) return;
    const recents = await projectApi.listRecent();
    const [hasM, config] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.read(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: config != null },
      projectConfigs: { ...s.projectConfigs, [project.path]: config },
    }));
  },

  openRecent: async (path) => {
    const project = await projectApi.openRecent(path);
    const recents = await projectApi.listRecent();
    if (!project) {
      set({ recents });
      return;
    }
    const [hasM, config] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.read(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: config != null },
      projectConfigs: { ...s.projectConfigs, [project.path]: config },
    }));
  },

  refreshMarkers: async (path) => {
    const has = await markersApi.has(path);
    set((s) => ({ hasMarkers: { ...s.hasMarkers, [path]: has } }));
  },

  refreshProjectConfig: async (path) => {
    const config = await projectConfigApi.read(path);
    set((s) => ({
      hasProjectConfig: { ...s.hasProjectConfig, [path]: config != null },
      projectConfigs: { ...s.projectConfigs, [path]: config },
    }));
  },

  addCase: (path, record) =>
    set((s) => ({
      cases: { ...s.cases, [path]: [...(s.cases[path] ?? []), record] },
    })),

  setActive: (path) => set({ activePath: path }),

  closeActive: () => {
    const closedPath = useProjectStore.getState().activePath;
    if (!closedPath) return;
    set((s) => {
      const open = s.open.filter((p) => p.path !== closedPath);
      const activePath = open.length ? open[open.length - 1].path : null;
      const cases = { ...s.cases };
      delete cases[closedPath];
      const projectConfigs = { ...s.projectConfigs };
      delete projectConfigs[closedPath];
      return { open, activePath, cases, projectConfigs };
    });
    const workspace = useWorkspaceStore.getState();
    workspace.tabs
      .filter((t) => t.projectPath === closedPath)
      .forEach((t) => workspace.closeTab(t.id));
  },
}));
