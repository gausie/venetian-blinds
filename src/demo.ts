export type Input = {
  up: boolean;
  down: boolean;
  select: boolean;
  reset: boolean;
  blackAndWhite: boolean;
};

// Mirrors the RAM the original keeps; names reference the zero-page addresses
export type DemoState = {
  /** $C2: how far the blinds are raised, 0 (closed) to 160 */
  raised: number;
  /** $C1: set by SELECT and never cleared except by RESET, which locks the joystick */
  locked: number;
  /** $83: SELECT auto-repeat delay */
  selectDelay: number;
  /** $80: game number toggled by SELECT; has no visible effect */
  game: number;
  /** $87: colour mask, $0F strips hue when the TV switch is on B&W */
  colourMask: number;
};

export const MAX_RAISED = 0xa0;

export const createState = (): DemoState => ({
  raised: 0,
  locked: 0,
  selectDelay: 0,
  game: 0,
  colourMask: 0xff,
});

// Runs once per frame during overscan, in the same order as the ROM
export function update(state: DemoState, input: Input): void {
  state.colourMask = input.blackAndWhite ? 0x0f : 0xff;

  if (input.reset) {
    // RESET re-enters the cold start but only clears RAM from $C0 up
    state.raised = 0;
    state.locked = 0;
    return;
  }

  if (!input.select) {
    state.selectDelay = 0;
  } else if (state.selectDelay > 0) {
    state.selectDelay--;
  } else {
    state.game ^= 1;
    state.locked = 30;
    state.selectDelay = 30;
  }

  if (state.locked) return;

  if (input.up) state.raised++;
  if (input.down) {
    state.raised--;
    if (state.raised < 0) state.raised = 0;
  }
  if (state.raised >= MAX_RAISED) state.raised = MAX_RAISED;
}
