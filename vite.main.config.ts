import { defineConfig } from 'vite';

import { aliases } from './vite.aliases';

export default defineConfig({
  resolve: { alias: aliases },
  build: {
    rollupOptions: {
      output: { entryFileNames: 'main.js' },
    },
  },
});
