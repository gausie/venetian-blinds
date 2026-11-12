import { Container, Graphics, Sprite } from "pixi.js";
import { artTexture } from "../../art/textures";

// A knuckle-first fist, seen from behind
const FIST = {
  art: [
    "..oooooooo..",
    ".oSSoSSoSSo.",
    "oSSSoSSoSSSo",
    "oSSSSSSSSSSo",
    "oSSSSSSSSSso",
    "oSSSSSSSSsso",
    ".oSSSSSSsso.",
    "..oSSSSsso..",
    "...oSSSso...",
    "...oSSsso...",
  ],
  colours: { o: 0x2a1408, S: 0xe0a070, s: 0xb07040 },
} as const;

/** Three raps, in seconds from the knock */
export const RAPS = [0, 0.18, 0.36];
const RAP_LENGTH = 0.09;
const DURATION = 0.7;
// Scene pixels are twice as wide as they are tall, and the fist is about half a brick wide
const SIZE = { x: 2, y: 4 } as const;

export class Fist extends Container {
  private readonly fist = new Sprite({ texture: artTexture(FIST.art, FIST.colours) });
  private readonly impact = new Graphics();
  private age: number | undefined;

  constructor() {
    super();
    this.fist.anchor.set(0.5);
    this.impact
      .rect(-20, -1, 5, 2)
      .rect(16, -1, 5, 2)
      .rect(-14, -26, 2, 6)
      .rect(13, -26, 2, 6)
      .rect(-14, 21, 2, 6)
      .rect(13, 21, 2, 6)
      .fill(0xffffff);
    this.addChild(this.impact, this.fist);
    this.visible = false;
  }

  start(x: number, y: number) {
    this.position.set(x, y);
    this.age = 0;
    this.visible = true;
  }

  tick(seconds: number) {
    if (this.age === undefined) return;
    this.age += seconds;
    const age = this.age;
    if (age > DURATION) {
      this.age = undefined;
      this.visible = false;
      return;
    }
    const rapping = RAPS.some((t) => age >= t && age < t + RAP_LENGTH);
    // Pulled back, the fist is bigger and further from the wall
    const reach = rapping ? 1 : 1.25;
    this.fist.scale.set(SIZE.x * reach, SIZE.y * reach);
    this.fist.y = rapping ? 0 : -6;
    this.impact.visible = rapping;
  }
}
