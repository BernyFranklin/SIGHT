import { defineConfig } from 'vitest/config';

import { aliases } from './vite.aliases';

export default defineConfig({
  resolve: { alias: aliases },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'electron/**/*.{test,spec}.ts',
      'shared/**/*.{test,spec}.ts',
      'saccades/**/*.{test,spec}.ts',
      'pupil/**/*.{test,spec}.ts',
      'viz/**/*.{test,spec}.ts',
      'cleaning/**/*.{test,spec}.ts',
    ],
  },
});
