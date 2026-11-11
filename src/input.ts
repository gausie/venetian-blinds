import type { Application, Container } from "pixi.js";

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
};

/** Drags are measured in `scene`'s own pixels */
export function createInput(app: Application, scene: Container): () => Input {
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
  const { stage } = app;
  stage.eventMode = "static";
  stage.hitArea = app.screen;
  stage.cursor = "ns-resize";
  stage.on("pointerdown", (e) => {
    const { y } = e.getLocalPosition(scene);
    drag = { startY: y, y };
  });
  stage.on("globalpointermove", (e) => {
    if (drag) drag.y = e.getLocalPosition(scene).y;
  });
  const release = () => {
    drag = undefined;
  };
  stage.on("pointerup", release);
  stage.on("pointerupoutside", release);

  return () => {
    const pad = navigator.getGamepads().find((p) => p !== null);
    const stick = pad?.axes[1] ?? 0;
    const pressed = (control: Control) => held.has(control) || pad?.buttons[PAD_BUTTONS[control]]?.pressed === true;
    return {
      direction: Number(pressed("up") || stick < -0.5) - Number(pressed("down") || stick > 0.5),
      dragged: drag && drag.y - drag.startY,
    };
  };
}
