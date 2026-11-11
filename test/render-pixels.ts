import { Application, RenderTexture, TextureStyle } from "pixi.js";
import type { DemoState } from "../src/demo";
import { SCREEN } from "../src/layout";
import { VenetianBlinds } from "../src/scene";

let ready: Promise<{ app: Application; scene: VenetianBlinds }> | undefined;

async function setup() {
  TextureStyle.defaultOptions.scaleMode = "nearest";
  const app = new Application();
  await app.init({ width: SCREEN.width, height: SCREEN.height, antialias: false, resolution: 1, roundPixels: true });
  const scene = new VenetianBlinds();
  app.stage.addChild(scene);
  return { app, scene };
}

/** RGBA pixels of one full frame */
export async function renderPixels(state: DemoState) {
  ready ??= setup();
  const { app, scene } = await ready;
  scene.update(state);
  // Render to a full-screen texture so the extract isn't cropped to the scene's bounds
  const target = RenderTexture.create({ width: SCREEN.width, height: SCREEN.height });
  app.renderer.render({ container: app.stage, target, clearColor: 0x000000 });
  const { pixels } = app.renderer.extract.pixels(target);
  target.destroy(true);
  return pixels;
}
