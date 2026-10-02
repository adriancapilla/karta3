import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/barajas/**', '**/server/**', '**/dist-server/**', '**/docs/**'] },
    proxy: {
      '/api': 'http://127.0.0.1:3000', '/media': 'http://127.0.0.1:3000', '/barajas': 'http://127.0.0.1:3000',
      '/socket.io': { target: 'http://127.0.0.1:3000', ws: true }
    }
  }
});
