import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // three / R3F stay in the lazily imported scene chunks so they never block first paint
        manualChunks: {
          gsap: ["gsap", "lenis"],
        },
      },
    },
  },
});
