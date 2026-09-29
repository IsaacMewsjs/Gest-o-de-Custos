import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // The app can be opened through a forwarded localhost port where Vite's
    // HMR WebSocket is not reachable. A full reload is safer than mixing old
    // and new React context modules after a failed HMR reconnect.
    hmr: false,
  },
});
