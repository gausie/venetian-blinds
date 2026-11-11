import { Sprite } from "pixi.js";
import { rgba, textureFromRgba } from "../textures";

const LOGO = {
  x: 21,
  y: 189,
  colour: 0xd77a99,
  art: [
    "....########....#######.........",
    ".#.....#...#...##...............",
    "###.##.#.#.#..##..###.#.###.#..#",
    "#.#.#..#.#.#.##.#.#...#.#.#.##.#",
    "###.#..#.#.###..#.###.#.#.#.####",
    "#.#.#..#.#.##...#...#.#.#.#.#.##",
    "#.#.##.#.#.#....#.###.#.###.#..#",
  ],
} as const;

export function createLogo() {
  const width = LOGO.art[0]?.length ?? 0;
  const pixels = [...LOGO.art.join("")].flatMap((pixel) => (pixel === "#" ? rgba(LOGO.colour) : [0, 0, 0, 0]));
  return new Sprite({ texture: textureFromRgba(width, LOGO.art.length, pixels), x: LOGO.x, y: LOGO.y });
}
