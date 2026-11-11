import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths, so the build works from a sub-path like GitHub Pages
  base: "./",
  // main.ts awaits Pixi's async init at the top level
  build: { target: "es2022" },
});
