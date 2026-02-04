import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'test',
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      'visage': resolve(__dirname, 'src/index.ts')
    }
  }
});
