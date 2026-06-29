
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    proxy: {
      // Development only - in production, Vercel handles API routing via vercel.json
      // Keep the full path including /api prefix
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  plugins: [react()]
});
