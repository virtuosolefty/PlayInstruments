import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pagesBase } from './scripts/build/pagesBase.mjs';

// GitHub Pages serves this project from /PlayInstruments/ (the repository's name), while local Vite
// previews are served from /. Keeping the base here makes both links work.
const base = pagesBase();

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // Web MIDI requires a secure context. localhost counts as secure, so plain
    // HTTP on localhost is fine. If you want to reach the app from another
    // device on your LAN you must serve it over HTTPS.
    host: 'localhost',
  },
  build: { outDir: 'dist', sourcemap: true },
  test: { environment: 'node', include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.mjs'], maxWorkers: 2, minWorkers: 1, testTimeout: 15000 },
});
