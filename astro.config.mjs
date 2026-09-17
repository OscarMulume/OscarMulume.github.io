import { defineConfig } from 'astro/config';

// Importé automatiquement par Vercel (static output) — pas d'adapter requis
export default defineConfig({
  site: 'https://oscarmulume.github.io',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssMinify: 'esbuild',
      target: 'esnext',
    },
  },
});