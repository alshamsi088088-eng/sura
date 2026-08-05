import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify aggressively
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
    // Generate sourcemaps only in dev
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        // NOTE: Custom manualChunks removed to eliminate circular chunk dependencies.
        // The previous manualChunks split recharts into 'vendor-charts' while its
        // transitive deps (react-redux, @reduxjs/toolkit, reselect, victory-vendor,
        // decimal.js-light, immer, es-toolkit, etc.) fell into 'vendor-other',
        // creating a circular import between the two chunks. At module-eval time
        // the imported binding `bo`/`w` (a reselect helper) was undefined, crashing
        // production with "Uncaught TypeError: w is not a function".
        // Vite/Rollup's automatic chunking avoids cycles and keeps the whole
        // dependency graph correctly ordered.
        // Compact output format
        compact: true,
        // Generate entry file names with content hash
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    react(),
  ],
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      '@supabase/supabase-js',
    ],
    exclude: [
      // Exclude heavy rarely-used libs from pre-bundling
      'firebase',
      'recharts',
      'react-syntax-highlighter',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'quill',
      'react-quill',
    ],
  },
});

