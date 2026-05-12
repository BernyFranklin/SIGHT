import { useProjectStore } from '@app/store/useProjectStore';

export type MenuItem =
  | { kind: 'item'; label: string; onSelect?: () => void; disabled?: boolean }
  | { kind: 'submenu'; label: string; items: MenuItem[]; disabled?: boolean }
  | { kind: 'separator' };

export type MenuSection = {
  id: string;
  label: string;
  items: MenuItem[];
};

// eslint-disable-next-line no-console
const log = (label: string) => () => console.info(`[menu] ${label}`);

const staticSections: MenuSection[] = [
  {
    id: 'view',
    label: 'View',
    items: [
      { kind: 'item', label: 'Toggle Timeline', onSelect: log('View > Toggle Timeline') },
      { kind: 'item', label: 'Toggle Scene Viewer', onSelect: log('View > Toggle Scene Viewer') },
      { kind: 'item', label: 'Toggle Inspector', onSelect: log('View > Toggle Inspector') },
      { kind: 'separator' },
      { kind: 'item', label: 'Zoom In', onSelect: log('View > Zoom In') },
      { kind: 'item', label: 'Zoom Out', onSelect: log('View > Zoom Out') },
      { kind: 'item', label: 'Reset Zoom', onSelect: log('View > Reset Zoom') },
      { kind: 'separator' },
      { kind: 'item', label: 'Toggle Full Screen', onSelect: log('View > Toggle Full Screen') },
      { kind: 'separator' },
      { kind: 'item', label: 'Toggle DevTools', onSelect: () => window.api?.windowControls.toggleDevTools() },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    items: [
      { kind: 'item', label: 'Run Fixation Detection', onSelect: log('Analysis > Fixation') },
      { kind: 'item', label: 'Run Saccade Detection', onSelect: log('Analysis > Saccade') },
      { kind: 'item', label: 'Compute AOIs', onSelect: log('Analysis > AOIs') },
      { kind: 'item', label: 'Calibration Check', onSelect: log('Analysis > Calibration Check') },
      { kind: 'separator' },
      { kind: 'item', label: 'Analysis Settings…', onSelect: log('Analysis > Settings') },
    ],
  },
  {
    id: 'visualize',
    label: 'Visualize',
    items: [
      { kind: 'item', label: 'Heatmap', onSelect: log('Visualize > Heatmap') },
      { kind: 'item', label: 'Scanpath', onSelect: log('Visualize > Scanpath') },
      { kind: 'item', label: 'Gaze Plot', onSelect: log('Visualize > Gaze Plot') },
      { kind: 'item', label: '3D Scene Overlay', onSelect: log('Visualize > 3D Scene Overlay') },
      { kind: 'separator' },
      { kind: 'item', label: 'Visualization Settings…', onSelect: log('Visualize > Settings') },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { kind: 'item', label: 'Documentation', onSelect: log('Help > Documentation') },
      { kind: 'item', label: 'Keyboard Shortcuts', onSelect: log('Help > Shortcuts') },
      { kind: 'item', label: 'Report Issue', onSelect: log('Help > Report Issue') },
      { kind: 'separator' },
      { kind: 'item', label: 'About SIGHT', onSelect: log('Help > About') },
    ],
  },
];

export function useMenuSections(): MenuSection[] {
  const createProject = useProjectStore((s) => s.createProject);
  const openProject = useProjectStore((s) => s.openProject);
  const openRecent = useProjectStore((s) => s.openRecent);
  const recents = useProjectStore((s) => s.recents);

  const recentItems: MenuItem[] = recents.length === 0
    ? [{ kind: 'item', label: 'Recent', disabled: true }]
    : [{
        kind: 'submenu',
        label: 'Recent',
        items: recents.slice(0, 3).map((p) => ({
          kind: 'item' as const,
          label: p.name,
          onSelect: () => void openRecent(p.path),
        })),
      }];

  const fileSection: MenuSection = {
    id: 'file',
    label: 'File',
    items: [
      { kind: 'item', label: 'New Project', onSelect: () => void createProject() },
      { kind: 'item', label: 'Open Project', onSelect: () => void openProject() },
      ...recentItems,
      { kind: 'separator' },
      { kind: 'item', label: 'Exit', onSelect: () => window.api?.windowControls.close() },
    ],
  };

  return [fileSection, ...staticSections];
}
