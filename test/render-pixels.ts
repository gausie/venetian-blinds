import { Application, RenderTexture } from "pixi.js";
import { InsideScene } from "../src/scenes/inside/InsideScene";

/** The archive.org player's screen size, where the scene should match the original exactly */
export const SCREEN = { width: 176, height: 223 } as const;

let ready: Promise<{ app: Application; scene: InsideScene }> | undefined;

async function setup() {
  const app = new Application();
  await app.init({ width: SCREEN.width, height: SCREEN.height });
  const scene = new InsideScene({ go() {}, restart() {}, showPointer() {} });
  scene.layout(SCREEN.width, SCREEN.height);
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
