import { Graphics, type Rectangle } from "pixi.js";
import { mix, roll } from "../../art/colour";
import type { Size } from "../../components/BorderedScene";
import { drawFlaws, FLAWS, type Flaw } from "./flaws";

/** The evening light from the view, top to bottom, falling across the bricks */
const LIGHT = [0x7d95fd, 0x9986fe, 0xb67beb, 0xcc77c6, 0xd77a99, 0xd78469, 0xca9242];
// Seven courses span the window; pixels are twice as tall as they are wide
const BRICK = { width: 34, lines: 17, mortarLines: 3, colour: 0x8a3422, mortar: 0x2a1c14 } as const;
const COURSE = BRICK.lines + BRICK.mortarLines;

/** The light at `t` (0 at the top of the wall, 1 at the bottom) */
function light(t: number) {
  const at = Math.min(Math.max(t, 0), 1) * (LIGHT.length - 1);
  const i = Math.floor(at);
  return mix(LIGHT[i] ?? 0, LIGHT[i + 1] ?? LIGHT[i] ?? 0, at - i);
}

/** Every other course is offset by half a brick */
const offset = (row: number) => (row % 2 ? BRICK.width / 2 : 0);

/** Starts perfect and decays a flaw at a time */
export class BrickWall extends Graphics {
  private size: Size = { width: 0, height: 0 };
  private readonly flawsByBrick = new Map<string, Set<Flaw>>();

  saveStory() {
    return [...this.flawsByBrick].map(([key, flaws]) => [key, [...flaws]] as const);
  }

  restoreStory(state: ReturnType<BrickWall["saveStory"]>) {
    this.flawsByBrick.clear();
    for (const [key, flaws] of state) this.flawsByBrick.set(key, new Set(flaws));
    this.draw();
  }

  layout(size: Size) {
    this.size = size;
    this.draw();
  }

  /** Somewhere not behind `avoid`, in wall pixels */
  addFlaw(avoid: Rectangle) {
    const rows = Math.ceil(this.size.height / COURSE);
    const cols = Math.ceil(this.size.width / BRICK.width) + 1;
    for (let tries = 0; tries < 100; tries++) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols) - 1;
      const flaw = FLAWS[Math.floor(Math.random() * FLAWS.length)] ?? "crack";
      const x0 = Math.max(0, col * BRICK.width + offset(row));
      const x1 = Math.min(this.size.width, (col + 1) * BRICK.width + offset(row));
      if (x1 - x0 < 4) continue;
      // Includes the course above, where a weed would grow
      const y0 = (row - 1) * COURSE;
      const y1 = (row + 1) * COURSE;
      const hidden = x1 > avoid.left && x0 < avoid.right && y1 > avoid.top && y0 < avoid.bottom;
      const key = `${col},${row}`;
      const flaws = this.flawsByBrick.get(key) ?? new Set<Flaw>();
      if (hidden || flaws.has(flaw)) continue;
      flaws.add(flaw);
      this.flawsByBrick.set(key, flaws);
      this.draw();
      return;
    }
  }

  private draw() {
    const { width, height } = this.size;
    this.clear();
    for (let row = 0; row * COURSE < height; row++) {
      const top = row * COURSE;
      const lit = light(top / height);
      const lines = Math.min(COURSE, height - top);
      const mortar = mix(BRICK.mortar, lit, 0.25);
      this.rect(0, top, width, lines).fill(mortar);
      for (let col = -1; col * BRICK.width - offset(row) < width; col++) {
        const x0 = Math.max(0, col * BRICK.width + offset(row));
        const x1 = Math.min(width, (col + 1) * BRICK.width + offset(row) - 1);
        if (x1 <= x0) continue;
        const colour = mix(BRICK.colour, lit, 0.4 + roll(col, row, 0, 3) * 0.06);
        const bottom = top + Math.min(BRICK.lines, lines);
        this.rect(x0, top, x1 - x0, bottom - top).fill(colour);
        const flaws = this.flawsByBrick.get(`${col},${row}`);
        if (!flaws) continue;
        const brick = { col, row, x0, x1, top, bottom, mortarLines: BRICK.mortarLines, colour, mortar, lit };
        drawFlaws(this, brick, flaws, width);
      }
    }
  }
}
