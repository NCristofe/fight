import { defineConfig } from 'vite';
import { attachRelay } from './server/relay.js';

// Hosts the 2-player room relay (/ws) on the same port as the dev/preview
// server, so `npm run dev` is all you need for online matches.
const onlineRelay = {
  name: 'online-relay',
  configureServer(server) {
    if (server.httpServer) attachRelay(server.httpServer, '/ws');
  },
  configurePreviewServer(server) {
    if (server.httpServer) attachRelay(server.httpServer, '/ws');
  }
};

export default defineConfig({
  base: './',
  plugins: [onlineRelay],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    target: 'es2019'
  }
});
