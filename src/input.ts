// Standard gamepad mapping: d-pad up and down
const PAD_BUTTONS = { up: 12, down: 13 } as const;
type Control = keyof typeof PAD_BUTTONS;

const KEYS: Partial<Record<string, Control>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
};

/** Merges the keyboard and the first gamepad into one joystick: 1 up, -1 down */
export function createInput(): () => number {
  const held = new Set<Control>();
  addEventListener("keydown", (e) => {
    const control = KEYS[e.code];
    if (!control) return;
    held.add(control);
    e.preventDefault();
  });
  addEventListener("keyup", (e) => {
    const control = KEYS[e.code];
    if (control) held.delete(control);
  });
  addEventListener("blur", () => held.clear());

  return () => {
    const pad = navigator.getGamepads().find((p) => p !== null);
    const stick = pad?.axes[1] ?? 0;
    const pressed = (control: Control) => held.has(control) || pad?.buttons[PAD_BUTTONS[control]]?.pressed === true;
    return Number(pressed("up") || stick < -0.5) - Number(pressed("down") || stick > 0.5);
  };
}
