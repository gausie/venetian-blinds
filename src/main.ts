import { Application } from "pixi.js";
import { createInput } from "./input";
import { MAX_RAISED, railY, raisedForRailY } from "./scene/Blinds";
import { VenetianBlinds } from "./scene/VenetianBlinds";
import "./style.css";

const app = new Application();
await app.init({ resizeTo: window, resolution: devicePixelRatio, autoDensity: true, roundPixels: true });
document.body.append(app.canvas);

const scene = new VenetianBlinds();
app.stage.addChild(scene);
const fitScene = () => scene.fit(app.screen.width, app.screen.height);
fitScene();
app.renderer.on("resize", fitScene);

let raised = 0;
const readInput = createInput(app, scene);

let dragStartRail: number | undefined;

// Runs before Pixi renders each frame, so input shows up in the very next frame
app.ticker.add(({ deltaTime }) => {
  const { direction, dragged } = readInput();
  if (dragged === undefined) {
    dragStartRail = undefined;
    // deltaTime is in 60Hz frames, and the blinds move a line a frame
    raised = Math.min(MAX_RAISED, Math.max(0, raised + direction * deltaTime));
  } else {
    dragStartRail ??= railY(Math.round(raised));
    raised = raisedForRailY(dragStartRail + dragged);
  }
  scene.update(Math.round(raised));
});
