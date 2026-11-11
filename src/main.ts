import { createState, update, type Input } from "./demo";
import { HEIGHT, WIDTH, renderFrame } from "./render";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#screen")!;
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext("2d")!;
const image = ctx.createImageData(WIDTH, HEIGHT);
const pixels = new Uint32Array(image.data.buffer);

const state = createState();
const keys = new Set<string>();
const held = new Set<string>();
let blackAndWhite = false;

// Stella-style console switches: F1 select, F2 reset, F3/F4 colour/B&W
const KEY_MAP: Record<string, string> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  F1: "select",
  F2: "reset",
};

addEventListener("keydown", (e) => {
  if (e.code === "F3") blackAndWhite = false;
  else if (e.code === "F4") blackAndWhite = true;
  else if (e.code in KEY_MAP) keys.add(KEY_MAP[e.code]);
  else return;
  e.preventDefault();
});
addEventListener("keyup", (e) => {
  if (e.code in KEY_MAP) keys.delete(KEY_MAP[e.code]);
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-control]")) {
  const control = button.dataset.control!;
  if (control === "bw") {
    button.addEventListener("click", () => {
      blackAndWhite = !blackAndWhite;
      button.setAttribute("aria-pressed", String(blackAndWhite));
    });
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

function readInput(): Input {
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
}

// The original runs ~269 lines per frame, a touch under 60Hz; 60Hz is close enough
const FRAME_MS = 1000 / 60;
let last = performance.now();
let pending = 0;

function tick(now: number) {
  pending = Math.min(pending + now - last, FRAME_MS * 5);
  last = now;
  while (pending >= FRAME_MS) {
    update(state, readInput());
    pending -= FRAME_MS;
  }
  renderFrame(state, pixels);
  ctx.putImageData(image, 0, 0);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
