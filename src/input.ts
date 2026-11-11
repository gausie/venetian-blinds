import type { Input } from "./demo";

type Control = "up" | "down" | "select" | "reset";
const CONTROLS: readonly Control[] = ["up", "down", "select", "reset"];
const isControl = (value: string | undefined): value is Control => CONTROLS.includes(value as Control);

// Stella-style console switches: F1 select, F2 reset
const KEYS: Partial<Record<string, Control>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  F1: "select",
  F2: "reset",
};

// Standard gamepad mapping: d-pad, back/select and start
const PAD_BUTTONS: Record<Control, number> = { up: 12, down: 13, select: 8, reset: 9 };

/** Merges keyboard, on-screen buttons and the first gamepad into one joystick and console */
export function createInput(): () => Input {
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

  for (const button of document.querySelectorAll<HTMLElement>("[data-control]")) {
    const control = button.dataset.control;
    if (!isControl(control)) continue;
    const release = () => held.delete(control);
    button.addEventListener("pointerdown", (e) => {
      held.add(control);
      button.setPointerCapture(e.pointerId);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
  }

  return () => {
    const pad = navigator.getGamepads().find((p) => p !== null);
    const stick = pad?.axes[1] ?? 0;
    const pressed = (control: Control) => held.has(control) || pad?.buttons[PAD_BUTTONS[control]]?.pressed === true;
    return {
      up: pressed("up") || stick < -0.5,
      down: pressed("down") || stick > 0.5,
      select: pressed("select"),
      reset: pressed("reset"),
    };
  };
}
