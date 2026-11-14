import { startRush } from "../../sound";

const WIND_UP_SECONDS = { hover: 5, hold: 1 } as const;
/** Seconds of shaking, and past `lockedAfter` nothing stops it; the roar comes in a little after the shaking starts */
const STARE = { shaking: 6, lockedAfter: 2, rushAfter: 0.8, maxShake: 24 } as const;

export type Gaze = "away" | keyof typeof WIND_UP_SECONDS;

/**
 * Looking at the glass: hovering slowly, holding quickly, winds it up; then the
 * screen shakes harder and harder, a roar builds under it, and `done` is called
 */
export class Stare {
  /** From 0 to 1, then the shaking starts */
  private windUp = 0;
  private shaking: number | undefined;
  private rush: ReturnType<typeof startRush> | undefined;
  private readonly hooks: { shake(cssPixels: number): void; done(): void };

  constructor(hooks: { shake(cssPixels: number): void; done(): void }) {
    this.hooks = hooks;
  }

  private get locked() {
    return this.shaking !== undefined && this.shaking >= STARE.lockedAfter;
  }

  stop() {
    this.windUp = 0;
    this.shaking = undefined;
    this.rush?.stop();
    this.rush = undefined;
    this.hooks.shake(0);
  }

  tick(seconds: number, gaze: Gaze) {
    if (this.shaking === undefined) {
      if (gaze === "away") {
        if (this.windUp > 0) this.stop();
        return;
      }
      this.windUp += seconds / WIND_UP_SECONDS[gaze];
      if (this.windUp < 1) return;
      this.shaking = 0;
    } else if (gaze === "away" && !this.locked) {
      this.stop();
      return;
    }
    this.shaking += seconds;
    if (this.shaking >= STARE.shaking) {
      this.stop();
      this.hooks.done();
      return;
    }
    const level = this.shaking / STARE.shaking;
    this.hooks.shake(STARE.maxShake * level ** 2);
    if (this.shaking >= STARE.rushAfter) {
      this.rush ??= startRush();
      this.rush.set((this.shaking - STARE.rushAfter) / (STARE.shaking - STARE.rushAfter));
    }
  }
}
