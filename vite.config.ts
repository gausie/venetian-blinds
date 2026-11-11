import { defineConfig } from "vite";

export default defineConfig({
  // main.ts awaits Pixi's async init at the top level
  build: { target: "es2022" },
});
