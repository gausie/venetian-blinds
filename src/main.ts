import { createPixelApp } from "./app";
import { createState, update } from "./demo";
import { createInput } from "./input";
import { fixedStep } from "./loop";
import { VenetianBlinds } from "./scene/VenetianBlinds";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#screen");
if (!canvas) throw new Error("Missing #screen canvas");

const app = await createPixelApp({ canvas });
const state = createState();
const readInput = createInput();
const scene = new VenetianBlinds();
app.stage.addChild(scene);
scene.update(state.raised);

// The original runs ~269 lines per frame, a touch under 60Hz; 60Hz is close enough
app.ticker.add(fixedStep(60, () => update(state, readInput())));
app.ticker.add(() => scene.update(state.raised));
