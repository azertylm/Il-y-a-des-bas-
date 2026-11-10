import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Version hébergée sans serveur (alphabette.fr) : server.ts est compilé pour
// le navigateur avec des remplaçants d'express/fs/path (voir static/staticApi.ts).
const STATIQUE = process.env.VITE_ALPHABETTE_STATIC === '1';
const shim = (nom: string) => path.resolve(__dirname, 'static/shims', nom);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // Correspondance exacte (^nom$) : « vite/modulepreload-polyfill » ne doit pas être remplacé.
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        ...(STATIQUE
          ? ['express', 'fs', 'path', 'vite', 'dotenv'].map((nom) => ({
              find: new RegExp(`^${nom}$`),
              replacement: shim(`${nom}.ts`),
            }))
          : []),
      ],
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
