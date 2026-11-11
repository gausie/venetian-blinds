import { Container, Graphics, type Sprite } from "pixi.js";
import { createLogo } from "./Logo";
import { Window } from "./Window";

/** Black border around the wall; the logo sits in the bottom one */
const BORDER = { x: 8, top: 20, bottom: 15 } as const;
const LOGO_OFFSET = { x: 21, y: 1 } as const;
const WALL_COLOUR = 0x854a00;

/** The smallest screen the window fits on, in pixels */
const MIN_SIZE = {
  width: 2 * BORDER.x + Window.WIDTH,
  height: BORDER.top + Window.HEIGHT + BORDER.bottom,
} as const;

export class VenetianBlinds extends Container {
  private readonly wall = new Graphics();
  private readonly window = new Window();
  private readonly logo: Sprite = createLogo();

  constructor() {
    super({ x: BORDER.x, y: BORDER.top });
    this.addChild(this.wall, this.window, this.logo);
  }

  /**
   * Fill a screen of `width` × `height` real pixels. Each pixel is 4×2 of them,
   * as in the archive.org player, or 2×1 when the window wouldn't fit that way.
   */
  fit(width: number, height: number) {
    const lineHeight = width >= MIN_SIZE.width * 4 && height >= MIN_SIZE.height * 2 ? 2 : 1;
    this.scale.set(2 * lineHeight, lineHeight);
    this.position.set(BORDER.x * this.scale.x, BORDER.top * this.scale.y);
    this.layout(Math.floor(width / this.scale.x), Math.floor(height / this.scale.y));
  }

  /** Fill a screen of `width` × `height` pixels at the scene's own scale */
  layout(width: number, height: number) {
    const wall = { width: width - 2 * BORDER.x, height: height - BORDER.top - BORDER.bottom };
    this.wall.clear().rect(0, 0, wall.width, wall.height).fill(WALL_COLOUR);
    this.window.position.set(
      Math.floor((wall.width - Window.WIDTH) / 2),
      Math.floor((wall.height - Window.HEIGHT) / 2),
    );
    this.logo.position.set(LOGO_OFFSET.x, wall.height + LOGO_OFFSET.y);
  }

  update(raised: number) {
    this.window.update(raised);
  }
}
