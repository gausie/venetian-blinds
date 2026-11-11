import { createApp } from "./app";
import { createInput } from "./input";
import { MAX_RAISED } from "./scene/Blinds";
import { VenetianBlinds } from "./scene/VenetianBlinds";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#screen");
if (!canvas) throw new Error("Missing #screen canvas");

const app = await createApp({ canvas });
let raised = 0;
const readDirection = createInput();
const scene = new VenetianBlinds();
app.stage.addChild(scene);

app.ticker.add(({ deltaTime }) => {
  // deltaTime is in 60Hz frames, and the blinds move a line a frame
  raised = Math.min(MAX_RAISED, Math.max(0, raised + readDirection() * deltaTime));
  scene.update(Math.round(raised));
});
