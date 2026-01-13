
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  root: '.',
  base: '/Manga-mangadex/',
  plugins: [angular()],
  build: {
    outDir: 'dist',
  },
  esbuild: {
    // Required for Angular decorators
    keepNames: true,
  }
});
