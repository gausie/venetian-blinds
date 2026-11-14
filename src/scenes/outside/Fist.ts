import { Container, Graphics, Sprite } from "pixi.js";
import { CSS_PIXELS_PER_HAND_PIXEL, FIST } from "../../art/hand";
import { artTexture } from "../../art/textures";

/** Three raps, in seconds from the knock */
export const RAPS = [0, 0.18, 0.36];
const RAP_LENGTH = 0.09;
const LINGER_AFTER_LAST_RAP = 0.34;
const PULL_BACK_PIXELS = 1;
/** The fist art is a little bigger than the pointer's, so bring it down to match */
const SHRINK = 0.85;

/** The pointer, balled up, knocking where it was; drawn in the hand's art pixels */
export class Fist extends Container {
  private readonly fist = new Sprite({ texture: artTexture(FIST.art, FIST.colours) });
  private readonly impact = new Graphics();
  private age: number | undefined;
  private raps: readonly number[] = [];
  private endsAt = 0;

  constructor() {
    super();
    // Strike lines fanning out above the knuckles
    this.impact
      .rect(10, -4, 1, 3)
      .rect(5, -3, 1, 1)
      .rect(6, -2, 1, 1)
      .rect(15, -3, 1, 1)
      .rect(14, -2, 1, 1)
      .fill(0xffffff);
    this.addChild(this.impact, this.fist);
    this.visible = false;
  }

  start(x: number, y: number, rapSeconds: readonly number[]) {
    this.raps = rapSeconds;
    this.endsAt = (rapSeconds.at(-1) ?? 0) + LINGER_AFTER_LAST_RAP;
    // Undo the scene's scaling so it's the pointer's size whatever the screen
    const scene = this.parent?.scale ?? { x: 1, y: 1 };
    const size = CSS_PIXELS_PER_HAND_PIXEL * SHRINK;
    this.scale.set(size / scene.x, size / scene.y);
    this.position.set(x, y);
    this.age = 0;
    this.visible = true;
  }

  tick(seconds: number) {
    if (this.age === undefined) return;
    this.age += seconds;
    const { age, raps } = this;
    if (age > this.endsAt) {
      this.age = undefined;
      this.visible = false;
      return;
    }
    const rapping = raps.some((t) => age >= t && age < t + RAP_LENGTH);
    this.fist.position.set(rapping ? 0 : -PULL_BACK_PIXELS);
    this.impact.visible = rapping;
  }
}
