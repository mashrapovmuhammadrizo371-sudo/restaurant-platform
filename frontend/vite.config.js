import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-time proxy so the frontend can call relative '/api' and '/uploads'
// paths without hardcoding the backend origin. In production, put both
// the frontend build and the backend behind the same reverse proxy so
// these same relative paths keep resolving (see project README).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
