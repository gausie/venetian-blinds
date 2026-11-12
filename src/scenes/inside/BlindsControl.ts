import { MAX_RAISED, railY, raisedForRailY } from "../../components/Blinds";
import type { Input } from "../../input";

/** Turns the joystick and drags into how far the blinds are raised */
export class BlindsControl {
  private raised = 0;
  private dragStartRail: number | undefined;

  saveStory() {
    return this.raised;
  }

  restoreStory(raised: number) {
    this.raised = raised;
  }

  /** Lines raised, after a frame of `input`; `deltaTime` is in 60Hz frames */
  tick({ direction, dragged }: Input, deltaTime: number) {
    if (dragged === undefined) {
      this.dragStartRail = undefined;
      // The blinds move a line a frame
      this.raised = Math.min(MAX_RAISED, Math.max(0, this.raised + direction * deltaTime));
    } else {
      this.dragStartRail ??= railY(Math.round(this.raised));
      this.raised = raisedForRailY(this.dragStartRail + dragged);
    }
    return Math.round(this.raised);
  }
}
