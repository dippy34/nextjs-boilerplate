import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset/data URLs so the build works from any path (e.g. GitHub Pages /<repo>/).
  base: './',
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  worker: { format: 'es' },
});
