import { Container, Graphics, Rectangle } from "pixi.js";
import { ease } from "../art/ease";
import { devMode, devModeAvailable } from "../devMode";
import { BLINDS_SIZE } from "./Blinds";
import { Eyelids } from "./Eyelids";
import { createLogo } from "./Logo";

const WAKE_SECONDS = { start: 0.4, open: 2 } as const;

/** Black border around the wall; the logo sits in the bottom one */
const BORDER = { x: 8, top: 20, bottom: 15 } as const;
const LOGO_OFFSET = { x: 21, y: 1 } as const;

/**
 * The smallest screen that fits a full set of blinds, in pixels. Every scene
 * uses it, so they all scale alike and switching between them never jumps.
 */
const MIN_SIZE = {
  width: 2 * BORDER.x + BLINDS_SIZE.width,
  height: BORDER.top + BLINDS_SIZE.height + BORDER.bottom,
} as const;

export type Size = { width: number; height: number };

/**
 * One frame's worth of time: `deltaTime` in 60Hz frames, `deltaMS` in
 * milliseconds, both sped up by `speed` in dev mode. Divide by `speed` for
 * anything that should keep to real time.
 */
export type Frame = { deltaTime: number; deltaMS: number; speed: number };

/** The original's black border and logo, around a wall each scene fills. Pixels are twice as wide as tall. */
export abstract class BorderedScene extends Container {
  /** The scene's contents, in wall coordinates and clipped to the wall */
  protected readonly wall = new Container();
  private readonly wallMask = new Graphics();
  private readonly logo = createLogo();
  private readonly devBorder = new Graphics();
  private readonly lids = new Eyelids();
  private realSecondsAwake: number | undefined;
  /** The whole screen, border and all, in the scene's own pixels */
  protected screen: Size = { width: 0, height: 0 };

  constructor() {
    super();
    // Scenes take pointer events from anywhere on screen, not just their drawn parts
    this.eventMode = "static";
    this.wall.position.set(BORDER.x, BORDER.top);
    this.wall.mask = this.wallMask;
    this.lids.position.copyFrom(this.wall.position);
    this.addChild(this.wallMask, this.wall, this.lids, this.devBorder, this.logo);

    if (devModeAvailable) {
      const { width, height } = this.logo;
      this.devBorder.rect(-1, -1, width + 2, height + 2).stroke({ width: 1, color: 0xff0000, alignment: 1 });
      this.devBorder.visible = devMode.on;
      devMode.subscribe((on) => {
        this.devBorder.visible = on;
      });
      this.logo.eventMode = "static";
      this.logo.on("pointerdown", (e) => {
        // Keep the click from knocking or dragging the blinds
        e.stopPropagation();
        devMode.toggle();
      });
    }
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
    if (width === this.screen.width && height === this.screen.height) return;
    this.screen = { width, height };
    this.hitArea = new Rectangle(0, 0, width, height);

    const wall = { width: width - 2 * BORDER.x, height: height - BORDER.top - BORDER.bottom };
    this.wallMask.clear().rect(BORDER.x, BORDER.top, wall.width, wall.height).fill(0xffffff);
    this.logo.position.set(
      BORDER.x + Math.min(LOGO_OFFSET.x, Math.round((wall.width * LOGO_OFFSET.x) / 160)),
      BORDER.top + wall.height + LOGO_OFFSET.y,
    );
    this.devBorder.position.copyFrom(this.logo.position);
    this.lids.layout(wall);
    this.layoutWall(wall);
  }

  /** Opens the eyes on this scene, from black */
  wake() {
    this.realSecondsAwake = 0;
    this.lids.shut(1);
  }

  /** From 0, open, to 1 */
  protected setLids(amount: number) {
    this.lids.shut(amount);
  }

  /** Called by the director each frame; scenes do their part in `tick` */
  advance(frame: Frame) {
    if (this.realSecondsAwake !== undefined) {
      // Real time, dev mode or not
      this.realSecondsAwake += frame.deltaMS / 1000 / frame.speed;
      this.lids.shut(1 - ease(this.realSecondsAwake, WAKE_SECONDS.start, WAKE_SECONDS.open));
      if (this.realSecondsAwake >= WAKE_SECONDS.open) this.realSecondsAwake = undefined;
    }
    this.tick(frame);
  }

  /** Arrange the scene's components on a wall this big */
  protected abstract layoutWall(wall: Size): void;

  /** Called before every frame while this scene is showing */
  abstract tick(frame: Frame): void;

  /** Called when the director shows this scene */
  enter() {}

  /** Called when the director moves on to another scene */
  leave() {}

  /** Where this scene is in the story, for carrying across a hot reload */
  saveStory(): unknown {
    return undefined;
  }

  restoreStory(_state: unknown) {}
}
