import { Graphics } from "pixi.js";

const BLOOD = { old: 0x5a0006, streak: 0x8a000a, fresh: 0xc01018, soaked: 0x2e0204 } as const;

/** It ran while the blinds were down, so it's this far along when seen, then creeps on over CREEP seconds */
const HEAD_START = 0.65;
const CREEP = 25;

/** How far along something is, from HEAD_START to 1, `rate` times faster than usual */
const grown = (seconds: number, rate = 1) => HEAD_START + (1 - HEAD_START) * Math.min(1, (seconds * rate) / CREEP);

/** In the portrait's pixels; the carpet starts at `top` */
const POOL = { x: 5, top: 43, width: 22, lines: 8 } as const;

/** In the portrait's pixels; `speed` is relative. One runs down the frame's side. */
const STREAKS = [
  { x: 1, from: 20, length: 9, speed: 0.8 },
  { x: 3, from: 20, length: 16, speed: 1.2 },
  { x: 4, from: 20, length: 5, speed: 0.5 },
  { x: 7, from: 20, length: 13, speed: 1 },
  { x: 10, from: 20, length: 7, speed: 0.7 },
  { x: 12, from: 20, length: 15, speed: 1.1 },
  { x: -1, from: 6, length: 30, speed: 1.5 },
] as const;

export class Blood extends Graphics {
  private elapsed: number | undefined;
  private pooled: number | undefined;

  saveStory() {
    return { elapsed: this.elapsed, pooled: this.pooled };
  }

  restoreStory(state: ReturnType<Blood["saveStory"]>) {
    this.elapsed = state.elapsed;
    this.pooled = state.pooled;
  }

  start() {
    this.elapsed ??= 0;
  }

  pool() {
    this.start();
    this.pooled ??= 0;
  }

  tick(seconds: number) {
    if (this.elapsed === undefined) return;
    this.elapsed += seconds;
    this.clear();
    if (this.pooled !== undefined) {
      this.pooled += seconds;
      this.drawPool(grown(this.pooled));
    }
    for (const { x, from, length, speed } of STREAKS) {
      const run = Math.floor(length * grown(this.elapsed, speed));
      if (run <= 0) continue;
      // Dried dark at the top, a wet bead at the tip
      this.rect(x, from, 1, run).fill(BLOOD.streak);
      this.rect(x, from, 1, Math.floor(run / 3)).fill(BLOOD.old);
      this.rect(x, from + run, 1, 2).fill(BLOOD.fresh);
    }
  }

  /** Flat side against the wall; `spread` from 0 to 1 */
  private drawPool(spread: number) {
    const halfWidth = (POOL.width / 2) * spread;
    const lines = Math.max(1, Math.round(POOL.lines * spread));
    for (let y = 0; y < lines; y++) {
      const t = (y + 0.5) / lines;
      const half = Math.round(halfWidth * Math.sqrt(1 - t ** 2));
      if (half <= 0) continue;
      this.rect(POOL.x - half, POOL.top + y, half * 2, 1).fill(BLOOD.old);
      const inner = Math.round(half * 0.6);
      if (inner > 0 && t < 0.7) this.rect(POOL.x - inner, POOL.top + y, inner * 2, 1).fill(BLOOD.soaked);
    }
  }
}
