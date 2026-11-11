import type { Input } from "./demo";

// Stella-style console switches: F1 select, F2 reset, F3/F4 colour/B&W
const KEY_MAP: Partial<Record<string, string>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  F1: "select",
  F2: "reset",
};

/** Merges keyboard, on-screen buttons and the first gamepad into one joystick */
export function createInput(): () => Input {
  const keys = new Set<string>();
  const held = new Set<string>();
  let blackAndWhite = false;
  const bwButton = document.querySelector<HTMLButtonElement>('[data-control="bw"]');
  const setBlackAndWhite = (value: boolean) => {
    blackAndWhite = value;
    bwButton?.setAttribute("aria-pressed", String(value));
  };

  addEventListener("keydown", (e) => {
    if (e.code === "F3") setBlackAndWhite(false);
    else if (e.code === "F4") setBlackAndWhite(true);
    else {
      const control = KEY_MAP[e.code];
      if (!control) return;
      keys.add(control);
    }
    e.preventDefault();
  });
  addEventListener("keyup", (e) => {
    const control = KEY_MAP[e.code];
    if (control) keys.delete(control);
  });
  addEventListener("blur", () => keys.clear());

  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-control]")) {
    const control = button.dataset.control;
    if (!control) continue;
    if (control === "bw") {
      button.addEventListener("click", () => setBlackAndWhite(!blackAndWhite));
      continue;
    }
    const release = () => held.delete(control);
    button.addEventListener("pointerdown", (e) => {
      held.add(control);
      button.setPointerCapture(e.pointerId);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
  }

  return () => {
    const pad = navigator.getGamepads?.().find((p) => p);
    const axis = pad?.axes[1] ?? 0;
    const on = (name: string) => keys.has(name) || held.has(name);
    return {
      up: on("up") || axis < -0.5 || !!pad?.buttons[12]?.pressed,
      down: on("down") || axis > 0.5 || !!pad?.buttons[13]?.pressed,
      select: on("select") || !!pad?.buttons[8]?.pressed,
      reset: on("reset") || !!pad?.buttons[9]?.pressed,
      blackAndWhite,
    };
  };
}
