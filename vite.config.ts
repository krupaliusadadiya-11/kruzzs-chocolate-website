import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The hero's 3D scene is a lazy chunk (three.js + drei), so normally the browser
 * only discovers it after the main script has downloaded and run — a waterfall
 * that delays the chocolate on a first visit. This adds <link rel="modulepreload">
 * tags for that chunk and everything it imports, so it downloads in parallel
 * with the page from the first byte of HTML. (Lazy loading is kept for the
 * other scenes below the fold.)
 */
function preloadHeroScene(): Plugin {
  return {
    name: "kz-preload-hero-scene",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const chunks = Object.values(bundle).filter((c) => c.type === "chunk");
        // FilmScene is also imported by the gift/pack scenes (shared lights), so it
        // lands in a shared chunk without a facade id — match by contained module
        const hero = chunks.find((c) => c.type === "chunk" && Object.keys(c.modules).some((id) => id.replace(/\\/g, "/").endsWith("/src/three/FilmScene.tsx")));
        if (!hero || hero.type !== "chunk") return html;
        const files = new Set<string>();
        const walk = (name: string) => {
          if (files.has(name)) return;
          files.add(name);
          const c = bundle[name];
          if (c && c.type === "chunk") c.imports.forEach(walk);
        };
        walk(hero.fileName);
        const tags = [...files]
          .filter((f) => !html.includes(f)) // the entry + its static imports are already linked
          .map((f) => `<link rel="modulepreload" crossorigin href="./${f}">`)
          .join("\n    ");
        return html.replace("</head>", `    ${tags}\n  </head>`);
      },
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), preloadHeroScene()],
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
