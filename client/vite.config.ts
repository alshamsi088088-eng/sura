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
        // Manual chunk splitting for vendors
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
          // UI frameworks
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-animation';
          }
          if (id.includes('node_modules/@heroicons/')) {
            return 'vendor-icons';
          }
          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // Socket.io
          if (id.includes('node_modules/socket.io-client/')) {
            return 'vendor-socket';
          }
          // Tiptap / Quill editors (only for edit pages)
          if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/quill/') || id.includes('node_modules/react-quill/')) {
            return 'vendor-editors';
          }
          // Charting
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Syntax highlighter
          if (id.includes('node_modules/react-syntax-highlighter/') || id.includes('node_modules/prismjs/') || id.includes('node_modules/refractor/')) {
            return 'vendor-syntax';
          }
          // Firebase
          if (id.includes('node_modules/firebase/')) {
            return 'vendor-firebase';
          }
          // Axios
          if (id.includes('node_modules/axios/')) {
            return 'vendor-http';
          }
          // Other vendor libs
          if (id.includes('node_modules/')) {
            return 'vendor-other';
          }
        },
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

