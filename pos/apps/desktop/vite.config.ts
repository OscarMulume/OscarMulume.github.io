import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    // Ordre important : le sous-chemin le plus long DOIT précéder le préfixe.
    alias: [
      {
        find: '@pos/security/desktop',
        replacement: fileURLToPath(
          new URL('../../packages/security/src/storage/keychain.desktop.ts', import.meta.url),
        ),
      },
      { find: '@pos/security', replacement: fileURLToPath(new URL('../../packages/security/src/index.ts', import.meta.url)) },
      { find: '@pos/core', replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
      { find: '@pos/ui', replacement: fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)) },
    ],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: false,
  },
  envPrefix: ['POS_'],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
  },
});