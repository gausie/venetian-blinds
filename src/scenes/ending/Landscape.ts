import type { Graphics } from "pixi.js";
import { roll } from "../../art/colour";
import type { Size } from "../../components/BorderedScene";
import { LANDSCAPE } from "../inside/View";

/** Where the hills start, as a share of the height: low, from down in the grass */
const HORIZON = 0.7;
/** Lines the view drops per pixel, left to right, with your head on its side on the ground */
const TILT = 0.15;
const BLADES = { dark: 0x1e4a00, mid: 0x2e6400, lit: 0x4a8a10 } as const;

/** The window's view, blown up and seen from the ground */
export function drawLandscape(g: Graphics, { width, height }: Size) {
  g.clear();
  const { bands, cell, gap } = LANDSCAPE;
  const hills = bands.findIndex((band) => band.gfx.includes("."));
  const aboveHills = bands.slice(0, hills).reduce<number>((sum, band) => sum + band.lines, 0);
  const belowHills = bands.slice(hills).reduce<number>((sum, band) => sum + band.lines, 0);
  // Scaled so the hills and fields fill the ground below the horizon; the sky gets the rest
  const scale = (height * (1 - HORIZON)) / belowHills;
  const cellWidth = cell * scale;
  for (let x = 0; x < width; x++) {
    const tilt = (x - width / 2) * TILT;
    let y = height * HORIZON - aboveHills * scale + tilt;
    const pattern = Math.floor(x / cellWidth) % 8;
    bands.forEach((band, i) => {
      const top = i === 0 ? 0 : Math.round(y);
      y += band.lines * scale;
      const bottom = i === bands.length - 1 ? height : Math.round(y);
      const colour = band.gfx[pattern] === "#" ? band.colour : gap;
      if (bottom > top) g.rect(x, top, 1, bottom - top).fill(colour);
    });
  }
}

export function drawBlades(g: Graphics, { width, height }: Size) {
  g.clear();
  for (let x = -4; x < width + 4; x++) {
    if (roll(x, 0, 55, 2) !== 0) continue;
    const tall = roll(x, 1, 56, 9) === 0 ? 0.55 + roll(x, 2, 57, 30) / 100 : 0.12 + roll(x, 3, 58, 22) / 100;
    const length = Math.round(height * tall);
    const lean = (roll(x, 4, 59, 7) - 3) / 10;
    const colour = [BLADES.dark, BLADES.mid, BLADES.lit][roll(x, 5, 60, 3)] ?? BLADES.dark;
    for (let up = 0; up < length; up += 2) {
      const along = up / length;
      const bx = Math.round(x + lean * along * along * length * 0.3);
      const w = along < 0.6 ? 2 : 1;
      g.rect(bx, height - up - 2, w, 2).fill(colour);
    }
  }
}
