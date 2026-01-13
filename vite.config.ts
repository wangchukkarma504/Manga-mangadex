import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  root: '.',
  base: './',
  plugins: [angular()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    assetsDir: 'assets'
  },
  server: {
    port: 4200,
    strictPort: true,
  }
});