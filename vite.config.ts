import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        // The API persists its state as JSON in the project root and rewrites those
        // files during ordinary reads (order polling, product fetches). Watching them
        // turns every poll into a full reload, which refetches and rewrites them
        // again — an endless refresh loop. Only source changes should reload.
        ignored: [
          '**/orders.json',
          '**/products.json',
          '**/staff.json',
          '**/loyalty.json',
          '**/loyalty_settings.json',
          '**/admin_pin.json',
          '**/database.json',
          '**/sheets_config.json',
          '**/uploads/**',
        ],
      },
    },
  };
});
