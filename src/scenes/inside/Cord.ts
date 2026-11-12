import { Graphics } from "pixi.js";
import { BLINDS_LINES } from "../../components/Blinds";

/** The line under the blinds, where the cord loops back up */
const SILL_Y = 1 + BLINDS_LINES;

const CORD = {
  strands: [8, 11],
  loop: { x: 9, width: 2 },
  colour: 0x000000,
} as const;

export function createCord() {
  const cord = new Graphics();
  for (const x of CORD.strands) cord.rect(x, 0, 1, SILL_Y);
  cord.rect(CORD.loop.x, SILL_Y, CORD.loop.width, 1);
  return cord.fill(CORD.colour);
}
