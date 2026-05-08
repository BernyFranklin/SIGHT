export type MenuItem =
  | { kind: 'item'; label: string; onSelect?: () => void; disabled?: boolean }
  | { kind: 'separator' };

export type MenuSection = {
  id: string;
  label: string;
  items: MenuItem[];
};

// eslint-disable-next-line no-console
const log = (label: string) => () => console.info(`[menu] ${label}`);

export const menuSections: MenuSection[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { kind: 'item', label: 'New Session', onSelect: log('File > New Session') },
      { kind: 'item', label: 'Open Recording…', onSelect: log('File > Open Recording') },
      { kind: 'item', label: 'Import Raw Gaze Data…', onSelect: log('File > Import Raw Gaze Data') },
      { kind: 'item', label: 'Recent', disabled: true },
      { kind: 'separator' },
      { kind: 'item', label: 'Export Results…', onSelect: log('File > Export Results') },
      { kind: 'separator' },
      { kind: 'item', label: 'Exit', onSelect: () => window.api?.windowControls.close() },
    ],
  },
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
