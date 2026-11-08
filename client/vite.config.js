import { defineConfig } from 'vite';

export default defineConfig({
  // Chemins relatifs : l'app fonctionne aussi dans un sous-dossier (GitHub Pages).
  base: './',
  server: { port: 5173 },
  preview: { port: 4173 },
});
