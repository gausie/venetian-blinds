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
  private size = { width: 0, height: 0 };

  constructor() {
    super();
    this.addChild(this.wall, this.window, this.logo);
  }

  /** Each pixel is 4×2 CSS pixels, or 2×1 when the window wouldn't fit */
  fit(width: number, height: number) {
    const lineHeight = width >= MIN_SIZE.width * 4 && height >= MIN_SIZE.height * 2 ? 2 : 1;
    this.scale.set(2 * lineHeight, lineHeight);
    this.layout(Math.floor(width / this.scale.x), Math.floor(height / this.scale.y));
  }

  /** Like fit, but in the scene's own pixels */
  layout(width: number, height: number) {
    // Resize events fire continuously while a window is dragged
    if (width === this.size.width && height === this.size.height) return;
    this.size = { width, height };

    const wall = { width: width - 2 * BORDER.x, height: height - BORDER.top - BORDER.bottom };
    this.wall.clear().rect(BORDER.x, BORDER.top, wall.width, wall.height).fill(WALL_COLOUR);
    this.window.position.set(
      BORDER.x + Math.floor((wall.width - Window.WIDTH) / 2),
      BORDER.top + Math.floor((wall.height - Window.HEIGHT) / 2),
    );
    this.logo.position.set(
      BORDER.x + Math.min(LOGO_OFFSET.x, Math.round((wall.width * LOGO_OFFSET.x) / 160)),
      BORDER.top + wall.height + LOGO_OFFSET.y,
    );
  }

  update(raised: number) {
    this.window.update(raised);
  }
}
