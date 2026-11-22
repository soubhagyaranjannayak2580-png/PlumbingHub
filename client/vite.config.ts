import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.API_URL || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/media': API,
      '/sitemap.xml': API,
      '/robots.txt': API,
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // three.js / R3F are intentionally NOT listed: they stay in lazy chunks loaded only with the 3D scenes.
        manualChunks: {
          motion: ['framer-motion', 'gsap'],
          react: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
        },
      },
    },
  },
});
