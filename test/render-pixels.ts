import { type Application, RenderTexture } from "pixi.js";
import { createPixelApp, SCREEN } from "../src/app";
import { VenetianBlinds } from "../src/scene/VenetianBlinds";

let ready: Promise<{ app: Application; scene: VenetianBlinds }> | undefined;

async function setup() {
  const app = await createPixelApp();
  const scene = new VenetianBlinds();
  app.stage.addChild(scene);
  return { app, scene };
}

/** RGBA pixels of one full frame */
export async function renderPixels(raised: number) {
  ready ??= setup();
  const { app, scene } = await ready;
  scene.update(raised);
  // Render to a full-screen texture so the extract isn't cropped to the scene's bounds
  const target = RenderTexture.create({ width: SCREEN.width, height: SCREEN.height });
  app.renderer.render({ container: app.stage, target, clearColor: 0x000000 });
  const { pixels } = app.renderer.extract.pixels(target);
  target.destroy(true);
  return pixels;
}
