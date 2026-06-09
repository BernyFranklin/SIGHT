import path from 'node:path';

const r = (p: string) => path.resolve(__dirname, p);

export const aliases = {
  '@app': r('src'),
  '@electron': r('electron'),
  '@shared': r('shared'),
  '@saccades': r('saccades'),
  '@pupil': r('pupil'),
  '@viz': r('viz'),
  '@cleaning': r('cleaning'),
} as const;
