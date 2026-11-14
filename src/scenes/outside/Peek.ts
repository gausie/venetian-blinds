import { MAX_RAISED } from "../../components/Blinds";

/** Seconds and lines a frame; `delay` is from the last rap */
const PEEK = { delay: 0.24, look: 1.2, speed: 2 } as const;

/** Someone answering a knock */
export class Peek {
  private sinceKnock: number | undefined;
  private secondsOpen: number | undefined;
  private raised = 0;

  get closed() {
    return this.raised === 0;
  }

  start(knockSeconds: number) {
    this.sinceKnock = -knockSeconds;
    this.secondsOpen = undefined;
  }

  /** Lines raised after this frame, and whether they've just reached the top */
  tick(deltaTime: number, seconds: number) {
    let target = 0;
    if (this.secondsOpen !== undefined) {
      this.secondsOpen += seconds;
      if (this.secondsOpen < PEEK.look) target = MAX_RAISED;
      else if (this.raised === 0) this.secondsOpen = undefined;
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
      this.secondsOpen = 0;
    }
    return { raised: Math.round(this.raised), opened };
  }
}
