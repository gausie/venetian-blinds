import { Container, Graphics } from "pixi.js";
import { createLogo } from "./Logo";
import { Window } from "./Window";

/** Where the playfield sits within the screen */
const PLAYFIELD = { x: 8, y: 20, width: 160 } as const;
const WALL = { height: 188, colour: 0x854a00 } as const;

export class VenetianBlinds extends Container {
  private readonly window = new Window();

  constructor() {
    super({ x: PLAYFIELD.x, y: PLAYFIELD.y });
    const wall = new Graphics().rect(0, 0, PLAYFIELD.width, WALL.height).fill(WALL.colour);
    this.addChild(wall, this.window, createLogo());
  }

  update(raised: number) {
    this.window.update(raised);
  }
}
