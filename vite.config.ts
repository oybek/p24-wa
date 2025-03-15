import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/p24-wa',
  server: {
    host: true,
    strictPort: true,
    port: 3000,
    allowedHosts: ['.ngrok-free.app'],
  },
});
