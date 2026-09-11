import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base = nombre del repo para GitHub Pages (project site):
// https://andr3smor.github.io/Nexa-EDA/
// Conmutable por env para desarrollo local o un fork con otro nombre.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/Nexa-EDA/",
  // Recharts + dataset de 1.197 conversaciones completas (~1.6 MB minificado)
  build: { outDir: "dist", assetsDir: "assets", chunkSizeWarningLimit: 2500 },
});
