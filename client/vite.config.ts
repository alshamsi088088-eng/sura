
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://sura-codex.com'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  plugins: [react()]
});
