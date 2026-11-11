import { Graphics } from "pixi.js";

/**
 * The view out of the window, drawn behind the blinds. The frame is the
 * playfield ($0E reflected); the pane is quad-width player 1, one band per
 * run of lines in $F23E (colours) and $F2CE (graphics, 4px per character).
 */
const VIEW = {
  // Starts below the window's top edge
  y: 1,
  frame: { xs: [4, 48], width: 12, colour: 0x493500 },
  pane: { x: 16, cell: 4 },
  bands: [
    { lines: 53, colour: 0x493500, gfx: "########" }, // top of the frame
    { lines: 16, colour: 0x7d95fd, gfx: "########" }, // sky
    { lines: 2, colour: 0x9986fe, gfx: "########" },
    { lines: 2, colour: 0xb67beb, gfx: "########" },
    { lines: 2, colour: 0xcc77c6, gfx: "########" },
    { lines: 2, colour: 0xd77a99, gfx: "########" },
    { lines: 1, colour: 0xd78469, gfx: "########" },
    { lines: 1, colour: 0xd78469, gfx: "###.###." }, // hills
    { lines: 1, colour: 0xca9242, gfx: "##...#.." },
    { lines: 1, colour: 0xca9242, gfx: "#......." },
    { lines: 2, colour: 0x854a00, gfx: "........" },
    { lines: 4, colour: 0x755600, gfx: "########" },
    { lines: 4, colour: 0x586600, gfx: "########" },
    { lines: 16, colour: 0x387200, gfx: "########" }, // grass
    { lines: 2, colour: 0x210b00, gfx: "########" }, // glazing bar
    { lines: 52, colour: 0x387200, gfx: "########" },
    { lines: 16, colour: 0x493500, gfx: "########" }, // sill, including the line under the blinds
  ],
  /** Missile 0, enabled for kernel lines 123 down to 16 */
  mullion: { x: 32, y: 1 + 53, height: 108, colour: 0x000000 },
} as const;

/** Runs of "#" in a row of player graphics, as [start, length] in cells */
function runs(gfx: string) {
  return [...gfx.matchAll(/#+/g)].map((m) => [m.index, m[0].length] as const);
}

/** The view out of the window: fixed in place, with the blinds drawn over it */
export function createView() {
  const view = new Graphics();
  const { frame, pane, bands, mullion } = VIEW;
  const height = bands.reduce<number>((sum, band) => sum + band.lines, 0);

  for (const x of frame.xs) view.rect(x, VIEW.y, frame.width, height).fill(frame.colour);

  let y = VIEW.y;
  for (const band of bands) {
    for (const [start, length] of runs(band.gfx)) {
      view.rect(pane.x + start * pane.cell, y, length * pane.cell, band.lines).fill(band.colour);
    }
    y += band.lines;
  }

  view.rect(mullion.x, mullion.y, 1, mullion.height).fill(mullion.colour);
  return view;
}
