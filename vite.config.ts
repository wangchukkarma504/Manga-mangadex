
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/Manga-mangadex/',
  build: {
    outDir: 'dist',
  },
  esbuild: {
    // Required for Angular decorators
    keepNames: true,
  }
});
