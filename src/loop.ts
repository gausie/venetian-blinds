import type { Ticker } from "pixi.js";

/**
 * Calls `step` at a fixed rate whatever the display's refresh rate, and
 * drops time rather than fast-forwarding after the tab has been in the background.
 */
export function fixedStep(hz: number, step: () => void) {
  const interval = 1000 / hz;
  let pending = 0;
  return ({ deltaMS }: Ticker) => {
    pending = Math.min(pending + deltaMS, interval * 5);
    while (pending >= interval) {
      step();
      pending -= interval;
    }
  };
}
