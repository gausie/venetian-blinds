const QUIET_SECONDS = 10;

/** Once armed, fires once after enough quiet */
export class Vigil {
  private quiet: number | undefined;
  private fired = false;

  saveStory() {
    return { quiet: this.quiet, fired: this.fired };
  }

  restoreStory(state: ReturnType<Vigil["saveStory"]>) {
    this.quiet = state.quiet;
    this.fired = state.fired;
  }

  /** Starts counting, unless it already is or has fired */
  arm() {
    if (!this.fired) this.quiet ??= 0;
  }

  reset() {
    if (this.quiet !== undefined) this.quiet = 0;
  }

  /** True on the tick the quiet runs out */
  tick(seconds: number) {
    if (this.quiet === undefined) return false;
    this.quiet += seconds;
    if (this.quiet < QUIET_SECONDS) return false;
    this.quiet = undefined;
    this.fired = true;
    return true;
  }
}
