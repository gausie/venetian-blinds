import { Application, TextureStyle } from "pixi.js";
import { createState, update } from "./demo";
import { createInput } from "./input";
import { SCREEN } from "./layout";
import { VenetianBlinds } from "./scene";
import "./style.css";

TextureStyle.defaultOptions.scaleMode = "nearest";

const canvas = document.querySelector<HTMLCanvasElement>("#screen");
if (!canvas) throw new Error("Missing #screen canvas");

const app = new Application();
await app.init({
  canvas,
  width: SCREEN.width,
  height: SCREEN.height,
  background: 0x000000,
  antialias: false,
  resolution: 1,
  roundPixels: true,
});

const state = createState();
const readInput = createInput();
const scene = new VenetianBlinds();
app.stage.addChild(scene);
scene.update(state);

// The original runs ~269 lines per frame, a touch under 60Hz; 60Hz is close enough
const FRAME_MS = 1000 / 60;
let pending = 0;
app.ticker.add(({ deltaMS }) => {
  pending = Math.min(pending + deltaMS, FRAME_MS * 5);
  while (pending >= FRAME_MS) {
    update(state, readInput());
    pending -= FRAME_MS;
  }
  scene.update(state);
});
