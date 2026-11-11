import { Application, type ApplicationOptions, TextureStyle } from "pixi.js";

/** Canvas size: 160 visible pixels with an 8px border either side, framed like the archive.org player */
export const SCREEN = { width: 176, height: 223 } as const;

/** A Pixi app at the native resolution, with nothing that would blur or blend pixels */
export async function createPixelApp(options: Partial<ApplicationOptions> = {}) {
  TextureStyle.defaultOptions.scaleMode = "nearest";
  const app = new Application();
  await app.init({
    width: SCREEN.width,
    height: SCREEN.height,
    background: 0x000000,
    antialias: false,
    resolution: 1,
    roundPixels: true,
    ...options,
  });
  return app;
}
