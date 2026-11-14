import { Application, Texture } from "pixi.js";
import { Director } from "./director";
import { createPointerToggle } from "./pointer";
import { EndingScene } from "./scenes/ending/EndingScene";
import { InsideScene } from "./scenes/inside/InsideScene";
import { OutsideScene } from "./scenes/outside/OutsideScene";
import "./style.css";

// Opaque white is already premultiplied; saying so stops Firefox warning on
// every Graphics fill's texture upload
Texture.WHITE.source.alphaMode = "premultiplied-alpha";

const app = new Application();
await app.init({ resizeTo: window, resolution: devicePixelRatio, autoDensity: true, roundPixels: true });
document.body.append(app.canvas);
addEventListener("contextmenu", (e) => e.preventDefault());

const director = new Director(
  app,
  {
    inside: (context) => new InsideScene(context),
    outside: (context) => new OutsideScene(context),
    ending: (context) => new EndingScene(context),
  },
  { initial: "inside", showPointer: createPointerToggle(app) },
);

// Hot reloads hand the story over to the re-run module rather than starting again
if (import.meta.hot) {
  const saved: ReturnType<Director["saveStory"]> | undefined = import.meta.hot.data.story;
  if (saved) director.restoreStory(saved);
  import.meta.hot.dispose((data) => {
    data.story = director.saveStory();
    director.stop();
    app.destroy({ removeView: true }, { children: true });
  });
  import.meta.hot.accept();
}
