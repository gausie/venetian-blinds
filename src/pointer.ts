import type { Application } from "pixi.js";

// Red Workbench-style arrow; each art pixel is drawn 2×2
const ART = [
  "K.........",
  "KK........",
  "KWK.......",
  "KWRK......",
  "KWRRK.....",
  "KWRRRK....",
  "KWRRRRK...",
  "KWRRRRRK..",
  "KWRRRRRRK.",
  "KWRRRKKKKK",
  "KWRKRRK...",
  "KWK.KRRK..",
  "KK..KRRK..",
  "K....KRRK.",
  ".....KRRK.",
  "......KK..",
];
const COLOURS: Partial<Record<string, string>> = { K: "#000", R: "#e02020", W: "#ffd8a0" };
const SCALE = 2;

function svg() {
  const rects = ART.flatMap((row, y) =>
    [...row].flatMap((pixel, x) => {
      const colour = COLOURS[pixel];
      return colour
        ? [`<rect x="${x * SCALE}" y="${y * SCALE}" width="${SCALE}" height="${SCALE}" fill="${colour}"/>`]
        : [];
    }),
  );
  const width = (ART[0]?.length ?? 0) * SCALE;
  const height = ART.length * SCALE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
}

/** Hotspot at the arrow's tip */
const CURSOR = `url("data:image/svg+xml,${encodeURIComponent(svg())}") 0 0, default`;

/** Returns a function that hides or shows the pointer */
export function createPointer(app: Application) {
  document.documentElement.style.cursor = CURSOR;
  app.renderer.events.cursorStyles.default = CURSOR;
  return (show: boolean) => {
    const cursor = show ? CURSOR : "none";
    if (app.renderer.events.cursorStyles.default === cursor) return;
    // Pixi reapplies its default on every move, so change both
    app.renderer.events.cursorStyles.default = cursor;
    app.canvas.style.cursor = cursor;
  };
}
