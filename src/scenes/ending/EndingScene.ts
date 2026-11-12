import { Graphics } from "pixi.js";
import { ease } from "../../art/ease";
import { BorderedScene, type Frame, type Size } from "../../components/BorderedScene";
import type { SceneContext } from "../../director";
import { playChew, playGroan, playSniff, playSquelch } from "../../sound";
import { drawBlades, drawLandscape } from "./Landscape";

/** Seconds into the ending */
const TIMELINE = {
  open: [1, 2.2],
  blinks: [4, 6.2, 8],
  blink: 0.35,
  /** Chewing, from slow to frantic, between these */
  feeding: [6.5, 11.6],
  death: 12,
  /** After this, any click starts over */
  end: 13,
} as const;

const CUES = [
  { at: 2.6, play: playSniff },
  { at: 3.4, play: playSniff },
  { at: 4.8, play: playGroan },
  { at: 5.9, play: playSniff },
  { at: 9.2, play: playGroan },
  { at: TIMELINE.death, play: playSquelch },
] as const;
const DROOP = 0.12;

export class EndingScene extends BorderedScene {
  private readonly landscape = new Graphics();
  private readonly blades = new Graphics();
  private elapsed = 0;
  private cued = 0;
  private nextChew = 0;

  constructor(context: SceneContext) {
    super({ mirrored: true });
    this.wall.addChild(this.landscape, this.blades);
    this.on("pointerdown", () => {
      // One last time, the eyes open
      if (this.elapsed >= TIMELINE.end) context.restart();
    });
  }

  override enter() {
    this.elapsed = 0;
    this.cued = 0;
    this.nextChew = TIMELINE.feeding[0];
  }

  protected layoutWall(wall: Size) {
    drawLandscape(this.landscape, wall);
    drawBlades(this.blades, wall);
  }

  /** Real time; it's not something to hurry */
  tick({ deltaMS, speed }: Frame) {
    this.elapsed += deltaMS / 1000 / speed;
    const t = this.elapsed;
    while (this.cued < CUES.length && t >= (CUES[this.cued]?.at ?? Infinity)) CUES[this.cued++]?.play();
    const [start, stop] = TIMELINE.feeding;
    if (t >= this.nextChew && t < stop) {
      // Hungrier as it goes: harder, and closer together
      const frenzy = (t - start) / (stop - start);
      playChew(0.3 + 0.7 * frenzy);
      this.nextChew = t + (0.7 - 0.45 * frenzy) * (0.7 + Math.random() * 0.6);
    }
    this.setLids(this.shut(t));
  }

  /** How shut the eyes are, from 0 (wide open) to 1 */
  private shut(t: number) {
    let shut = 1 - ease(t, TIMELINE.open[0], TIMELINE.open[1]);
    TIMELINE.blinks.forEach((at, i) => {
      // Each blink down and back up, and each leaves the lids a little lower
      if (t >= at) shut = Math.max(shut, DROOP * (i + 1));
      const half = TIMELINE.blink / 2;
      if (t >= at && t < at + TIMELINE.blink) shut = Math.max(shut, 1 - Math.abs(t - at - half) / half);
    });
    // Finished: straight to black
    return t >= TIMELINE.death ? 1 : shut;
  }
}
