import type { Graphics } from "pixi.js";
import { mix, roll } from "../../art/colour";

export const FLAWS = ["raked", "chip", "crack", "moss", "weed"] as const;
export type Flaw = (typeof FLAWS)[number];

const HOLLOW = 0x140b06;
const MOSS = [0x3d6420, 0x56852a, 0x2e4c18] as const;
const WEED = { stem: 0x4a7a22, leaf: 0x6a9a30 } as const;

/** In wall pixels */
export type Brick = {
  col: number;
  row: number;
  x0: number;
  x1: number;
  top: number;
  /** Where its mortar joint starts */
  bottom: number;
  mortarLines: number;
  colour: number;
  mortar: number;
  /** The light on this course */
  lit: number;
};

/** Fills a rectangle, clipped to the brick and the joint below it */
type Paint = (x: number, y: number, w: number, h: number, colour: number) => void;

/** Shapes come from `roll` so they survive redraws. Add a flaw here and to FLAWS. */
const DRAW: Record<Flaw, (brick: Brick, paint: Paint, g: Graphics) => void> = {
  raked(b, paint) {
    const start = b.x0 + roll(b.col, b.row, 2, Math.max(1, b.x1 - b.x0 - 8));
    const length = 6 + roll(b.col, b.row, 3, 12);
    for (let x = start; x < start + length; x++) {
      paint(x, b.bottom, 1, 1 + roll(x, b.row, 4, b.mortarLines), HOLLOW);
    }
  },

  chip(b, paint) {
    const right = roll(b.col, b.row, 6, 2) === 1;
    const top = roll(b.col, b.row, 7, 2) === 1;
    const w = 2 + roll(b.col, b.row, 8, 2);
    const h = 3 + roll(b.col, b.row, 9, 4);
    const x = right ? b.x1 - w : b.x0;
    const y = top ? b.top : b.bottom - h;
    paint(x, y, w, h, mix(b.mortar, b.lit, 0.15));
    paint(right ? x - 1 : x + w, top ? y : y + h - 2, 1, 2, mix(b.colour, 0x000000, 0.35));
  },

  crack(b, paint) {
    const dark = mix(b.colour, 0x000000, 0.6);
    let x = b.x0 + 3 + roll(b.col, b.row, 11, Math.max(1, b.x1 - b.x0 - 6));
    let y = b.top + roll(b.col, b.row, 12, 4);
    const end = Math.min(b.bottom, y + 8 + roll(b.col, b.row, 13, 10));
    while (y < end) {
      const run = 1 + roll(x, y, 14, 3);
      paint(x, y, 1, run, dark);
      y += run;
      x += roll(x, y, 15, 3) - 1;
    }
  },

  moss(b, paint) {
    const start = b.x0 + roll(b.col, b.row, 17, Math.max(1, b.x1 - b.x0 - 6));
    const length = 4 + roll(b.col, b.row, 18, 8);
    for (let x = start; x < start + length; x++) {
      const colour = mix(MOSS[roll(x, b.row, 19, MOSS.length)] ?? MOSS[0], b.lit, 0.2);
      const creep = roll(x, b.row, 20, 4);
      paint(x, b.bottom - creep, 1, creep + b.mortarLines, colour);
    }
  },

  weed(b, _paint, g) {
    // Grows up past the brick, so isn't clipped to it
    const x = b.x0 + 2 + roll(b.col, b.row, 22, Math.max(1, b.x1 - b.x0 - 4));
    const base = b.bottom + 1;
    const height = 5 + roll(b.col, b.row, 23, 6);
    g.rect(x, base - height, 1, height).fill(mix(WEED.stem, b.lit, 0.2));
    for (let i = 2; i < height; i += 3) {
      const side = (i / 3) % 2 < 1 ? -1 : 1;
      g.rect(x + side, base - i - 1, 1, 2).fill(mix(WEED.leaf, b.lit, 0.2));
    }
  },
};

/** Kept inside a wall `wallWidth` pixels wide */
export function drawFlaws(g: Graphics, b: Brick, flaws: ReadonlySet<Flaw>, wallWidth: number) {
  const paint: Paint = (x, y, w, h, colour) => {
    const left = Math.max(x, 0);
    const right = Math.min(x + w, b.x1 + 1, wallWidth);
    const top = Math.max(y, b.top);
    const end = Math.min(y + h, b.bottom + b.mortarLines);
    if (right > left && end > top) g.rect(left, top, right - left, end - top).fill(colour);
  };
  for (const flaw of flaws) DRAW[flaw](b, paint, g);
}
