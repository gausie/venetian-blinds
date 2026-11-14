import type { Application } from "pixi.js";
import { CSS_PIXELS_PER_HAND_PIXEL, HAND } from "./art/hand";
import { artPixels } from "./art/textures";

const hex = (colour: number) => `#${colour.toString(16).padStart(6, "0")}`;

function svg() {
  const scale = CSS_PIXELS_PER_HAND_PIXEL;
  const rects = artPixels(HAND.art, HAND.colours).map(
    ({ x, y, colour }) =>
      `<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}" fill="${hex(colour)}"/>`,
  );
  const width = (HAND.art[0]?.length ?? 0) * scale;
  const height = HAND.art.length * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
}

const CURSOR = `url("data:image/svg+xml,${encodeURIComponent(svg())}") 0 0, default`;

export function createPointerToggle(app: Application) {
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
