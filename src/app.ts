import { Application, type ApplicationOptions } from "pixi.js";

/** Framed like the archive.org player: 160px playfield with an 8px border either side */
export const SCREEN = { width: 176, height: 223 } as const;

export async function createApp(options: Partial<ApplicationOptions> = {}) {
  const app = new Application();
  await app.init({ width: SCREEN.width, height: SCREEN.height, ...options });
  return app;
}
