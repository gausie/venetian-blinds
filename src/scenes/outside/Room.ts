import { Graphics } from "pixi.js";
import { roll } from "../../art/colour";
import { WALL_COLOUR } from "../../palette";

// Mirrors where the grass starts in the view from inside
export const FLOOR_Y = 38;
const SKIRTING = { lines: 2, colour: 0x3a2000 } as const;
const CARPET = { colour: 0x5e4c3a, stains: [0x4a3a2a, 0x6c5a44, 0x3e3022] } as const;

export function createRoom(width: number, height: number) {
  const room = new Graphics().rect(0, 0, width, FLOOR_Y).fill(WALL_COLOUR);
  room.rect(0, FLOOR_Y, width, SKIRTING.lines).fill(SKIRTING.colour);
  const top = FLOOR_Y + SKIRTING.lines;
  room.rect(0, top, width, height - top).fill(CARPET.colour);
  for (let y = top; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const stain = CARPET.stains[roll(x, y, 31, 23)];
      if (stain !== undefined) room.rect(x, y, 1, 1).fill(stain);
    }
  }
  return room;
}
