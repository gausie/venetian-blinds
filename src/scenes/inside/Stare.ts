import { startRush, unlockAudio } from "../../sound";

/** Seconds of calm, then of shaking; the roar comes in a little after the shaking starts */
const STARE = { calm: 3, shaking: 6, rushAfter: 0.8, maxShake: 24 } as const;

/**
 * Holding on the glass: nothing at first, then the screen shakes harder and
 * harder, a roar builds under it, and then it all stops and `done` is called
 */
export class Stare {
  private elapsed: number | undefined;
  private rush: ReturnType<typeof startRush> | undefined;
  private readonly hooks: { shake(cssPixels: number): void; done(): void };

  constructor(hooks: { shake(cssPixels: number): void; done(): void }) {
    this.hooks = hooks;
  }

  get active() {
    return this.elapsed !== undefined;
  }

  /** Call from the pointer event, since audio can only start from a gesture */
  start() {
    unlockAudio();
    this.elapsed = 0;
  }

  stop() {
    this.elapsed = undefined;
    this.rush?.stop();
    this.rush = undefined;
    this.hooks.shake(0);
  }

  tick(seconds: number) {
    if (this.elapsed === undefined) return;
    this.elapsed += seconds;
    const shaking = this.elapsed - STARE.calm;
    if (shaking < 0) return;
    if (shaking >= STARE.shaking) {
      this.stop();
      this.hooks.done();
      return;
    }
    const level = shaking / STARE.shaking;
    this.hooks.shake(STARE.maxShake * level ** 2);
    if (shaking >= STARE.rushAfter) {
      this.rush ??= startRush();
      this.rush.set((shaking - STARE.rushAfter) / (STARE.shaking - STARE.rushAfter));
    }
  }
}
