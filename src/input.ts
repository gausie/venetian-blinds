import type { Container, PointData } from "pixi.js";

// Standard gamepad mapping: d-pad up and down
const PAD_BUTTONS = { up: 12, down: 13 } as const;
type Control = keyof typeof PAD_BUTTONS;

const KEYS: Partial<Record<string, Control>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
};

export type Input = {
  /** Keyboard and gamepad merged into one joystick: 1 up, -1 down */
  direction: number;
  /** Pixels dragged since the pointer went down, or undefined while it's up */
  dragged: number | undefined;
  /** In global pixels, or undefined once it leaves the screen */
  pointer: PointData | undefined;
  pressed: boolean;
};

/** Drags start on `scene` and are measured in its own pixels */
export function createInput(scene: Container): () => Input {
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

  let drag: { startY: number; y: number } | undefined;
  let pointer: PointData | undefined;
  scene.on("pointerdown", (e) => {
    pointer = e.global.clone();
    const { y } = e.getLocalPosition(scene);
    drag = { startY: y, y };
  });
  scene.on("globalpointermove", (e) => {
    pointer = e.global.clone();
    if (drag) drag.y = e.getLocalPosition(scene).y;
  });
  scene.on("pointerleave", () => {
    pointer = undefined;
  });
  const release = () => {
    drag = undefined;
  };
  scene.on("pointerup", release);
  scene.on("pointerupoutside", release);

  return () => {
    const pad = navigator.getGamepads().find((p) => p !== null);
    const stick = pad?.axes[1] ?? 0;
    const pressed = (control: Control) => held.has(control) || pad?.buttons[PAD_BUTTONS[control]]?.pressed === true;
    return {
      direction: Number(pressed("up") || stick < -0.5) - Number(pressed("down") || stick > 0.5),
      dragged: drag && drag.y - drag.startY,
      pointer,
      pressed: drag !== undefined,
    };
  };
}
