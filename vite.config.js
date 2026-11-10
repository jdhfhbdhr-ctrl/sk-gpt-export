import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  server: {
    allowedHosts: true,
    host: "0.0.0.0",
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  plugins: [react()]
});
