import { Container, Graphics } from "pixi.js";
import { SLAT } from "../../components/Blinds";

/** Slow and deliberate, in seconds from the first */
export const TAPS = [0, 0.9, 1.8] as const;
const FLEX_SECONDS = 0.15;
const FLEX_HALF_WIDTH = 4;

/** Flexes the slat in front of each tap out of line */
export class Tapping extends Container {
  private readonly slat = new Graphics();
  private elapsed: number | undefined;

  /** In the parent's pixels */
  constructor(at: { x: number; y: number }, slatY: number) {
    super();
    SLAT.forEach((colour, row) => {
      this.slat.rect(at.x - FLEX_HALF_WIDTH, slatY + row + 1, FLEX_HALF_WIDTH * 2 + 1, 1).fill(colour);
    });
    this.addChild(this.slat);
    this.slat.visible = false;
  }

  start() {
    this.elapsed = 0;
  }

  tick(seconds: number) {
    if (this.elapsed === undefined) return;
    this.elapsed += seconds;
    const elapsed = this.elapsed;
    this.slat.visible = TAPS.some((t) => elapsed >= t && elapsed < t + FLEX_SECONDS);
    if (elapsed > (TAPS.at(-1) ?? 0) + FLEX_SECONDS) this.elapsed = undefined;
  }
}
