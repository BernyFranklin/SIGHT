import { create } from 'zustand';

import { casesApi } from '@app/api/cases';
import { markersApi } from '@app/api/markers';
import { type Project, projectApi } from '@app/api/project';
import { type ProjectConfigFile, projectConfigApi } from '@app/api/projectConfig';
import { useWorkspaceStore } from '@app/store/useWorkspaceStore';

/**
 * A research subject within a project, loaded from `.sight/cases.json`. The raw gaze
 * file is copied into the project at `.sight/cases/<id>.csv`; here we keep only its
 * `fileName`/`fileSize` for display. `demographics` is a schema-keyed value map whose
 * missing/null entries flag a case as "incomplete" when the project's demographic
 * schema gains fields after the case was created.
 */
export interface CaseRecord {
  id: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  demographics: Record<string, string | number | null>;
}

interface ProjectState {
  open: Project[];
  activePath: string | null;
  recents: Project[];
  hasMarkers: Record<string, boolean>;
  hasProjectConfig: Record<string, boolean>;
  hasCases: Record<string, boolean>;
  projectConfigs: Record<string, ProjectConfigFile | null>;
  cases: Record<string, CaseRecord[]>;
  loadRecents: () => Promise<void>;
  createProject: () => Promise<void>;
  openProject: () => Promise<void>;
  openRecent: (path: string) => Promise<void>;
  refreshMarkers: (path: string) => Promise<void>;
  refreshProjectConfig: (path: string) => Promise<void>;
  refreshCases: (path: string) => Promise<void>;
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
  hasCases: {},
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
    const [hasM, config, casesFile] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.read(project.path),
      casesApi.read(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: config != null },
      hasCases: { ...s.hasCases, [project.path]: casesFile != null },
      projectConfigs: { ...s.projectConfigs, [project.path]: config },
      cases: { ...s.cases, [project.path]: casesFile?.cases ?? [] },
    }));
  },

  openProject: async () => {
    const project = await projectApi.open();
    if (!project) return;
    const recents = await projectApi.listRecent();
    const [hasM, config, casesFile] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.read(project.path),
      casesApi.read(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: config != null },
      hasCases: { ...s.hasCases, [project.path]: casesFile != null },
      projectConfigs: { ...s.projectConfigs, [project.path]: config },
      cases: { ...s.cases, [project.path]: casesFile?.cases ?? [] },
    }));
  },

  openRecent: async (path) => {
    const project = await projectApi.openRecent(path);
    const recents = await projectApi.listRecent();
    if (!project) {
      set({ recents });
      return;
    }
    const [hasM, config, casesFile] = await Promise.all([
      markersApi.has(project.path),
      projectConfigApi.read(project.path),
      casesApi.read(project.path),
    ]);
    set((s) => ({
      open: addOpen(s.open, project),
      activePath: project.path,
      recents,
      hasMarkers: { ...s.hasMarkers, [project.path]: hasM },
      hasProjectConfig: { ...s.hasProjectConfig, [project.path]: config != null },
      hasCases: { ...s.hasCases, [project.path]: casesFile != null },
      projectConfigs: { ...s.projectConfigs, [project.path]: config },
      cases: { ...s.cases, [project.path]: casesFile?.cases ?? [] },
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

  refreshCases: async (path) => {
    const casesFile = await casesApi.read(path);
    set((s) => ({
      hasCases: { ...s.hasCases, [path]: casesFile != null },
      cases: { ...s.cases, [path]: casesFile?.cases ?? [] },
    }));
  },

  setActive: (path) => set({ activePath: path }),

  closeActive: () => {
    const closedPath = useProjectStore.getState().activePath;
    if (!closedPath) return;
    set((s) => {
      const open = s.open.filter((p) => p.path !== closedPath);
      const activePath = open.length ? open[open.length - 1].path : null;
      const cases = { ...s.cases };
      delete cases[closedPath];
      const hasCases = { ...s.hasCases };
      delete hasCases[closedPath];
      const projectConfigs = { ...s.projectConfigs };
      delete projectConfigs[closedPath];
      return { open, activePath, cases, hasCases, projectConfigs };
    });
    const workspace = useWorkspaceStore.getState();
    workspace.tabs
      .filter((t) => t.projectPath === closedPath)
      .forEach((t) => workspace.closeTab(t.id));
  },
}));
