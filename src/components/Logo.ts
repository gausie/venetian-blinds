import { Sprite } from "pixi.js";
import { artTexture } from "../art/textures";

const LOGO = {
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
  return new Sprite({ texture: artTexture(LOGO.art, { "#": LOGO.colour }) });
}
