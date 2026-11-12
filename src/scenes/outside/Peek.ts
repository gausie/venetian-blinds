import { MAX_RAISED } from "../../components/Blinds";

/** Seconds and lines a frame. The look is real time even in dev mode, so there's time to see in. */
const PEEK = { delay: 0.6, look: 1.2, speed: 2 } as const;

/** Someone answering a knock */
export class Peek {
  private sinceKnock: number | undefined;
  private realSecondsOpen: number | undefined;
  private raised = 0;

  get closed() {
    return this.raised === 0;
  }

  start() {
    this.sinceKnock = 0;
    this.realSecondsOpen = undefined;
  }

  /** Lines raised after this frame, and whether they've just reached the top */
  tick(deltaTime: number, seconds: number, realSeconds: number) {
    let target = 0;
    if (this.realSecondsOpen !== undefined) {
      this.realSecondsOpen += realSeconds;
      if (this.realSecondsOpen < PEEK.look) target = MAX_RAISED;
      else if (this.raised === 0) this.realSecondsOpen = undefined;
    } else if (this.sinceKnock !== undefined) {
      this.sinceKnock += seconds;
      if (this.sinceKnock > PEEK.delay) target = MAX_RAISED;
    }
    const wasOpen = this.raised >= MAX_RAISED;
    const step = PEEK.speed * deltaTime;
    this.raised = target > this.raised ? Math.min(target, this.raised + step) : Math.max(target, this.raised - step);
    const opened = !wasOpen && this.raised >= MAX_RAISED;
    if (opened) {
      this.sinceKnock = undefined;
      this.realSecondsOpen = 0;
    }
    return { raised: Math.round(this.raised), opened };
  }
}
