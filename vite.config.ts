import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/p24-wa' : '/fe',
  server: {
    host: true,
    strictPort: true,
    port: 3000,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev'],
  },
}));
