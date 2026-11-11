import { Container, Graphics, TilingSprite } from "pixi.js";
import { rgba, textureFromRgba } from "../textures";

/** The blinds span the window */
const WIDTH = 64;

/** Lines the blinds can cover below the window's top edge */
export const BLINDS_LINES = 176;

// One full slat repeats every 8 lines; $F700 holds how it looks as it gets
// squashed onto the bottom rail, by how many lines it has been squashed
const SLAT = [0x000000, 0x2c2c2c, 0x535353, 0x777777, 0x9a9a9a, 0xbcbcbc, 0xdedede, 0xffffff];
const SQUASHED_SLATS = [
  [0x000000, 0x2c2c2c, 0x535353, 0x777777, 0x9a9a9a, 0xbcbcbc, 0xdedede, 0xffffff],
  [0x000000, 0x000000, 0x2c2c2c, 0x535353, 0x777777, 0x9a9a9a, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x2c2c2c, 0x535353, 0x9a9a9a, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x2c2c2c, 0x777777, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x2c2c2c, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x777777, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000],
] as const;
/** Slats stacked on the bottom rail alternate edge-on white and black */
const STACKED_SLAT = [0xffffff, 0x000000];

/** Player 1 at quad width, gfx $81 */
const POSTS = { offsets: [16, 44], width: 4, colour: 0x6d5a00 } as const;

/** A 1px wide column of colours tiled across the window */
const tiling = (colours: readonly number[]) =>
  new TilingSprite({
    texture: textureFromRgba(1, colours.length, colours.flatMap(rgba)),
    width: WIDTH,
    visible: false,
  });

/**
 * Slats hanging from the top of the window, the slat being squashed onto the
 * bottom rail, and the slats already stacked on it. Below that, the view.
 */
export class Blinds extends Container {
  private readonly slats = tiling(SLAT);
  // Each squashed pattern only shows from its own row onwards
  private readonly squashed = SQUASHED_SLATS.map((pattern, row) => tiling(pattern.slice(row)));
  private readonly stacked = tiling(STACKED_SLAT);
  private readonly sill = new TilingSprite({ width: WIDTH, height: 1, visible: false });
  private readonly posts = new Graphics();

  constructor() {
    super();
    // The window's top edge shows before the first slat, in the playfield's base colour
    const edge = new Graphics().rect(0, 0, WIDTH, 1).fill(0x000000);
    this.addChild(edge, this.slats, ...this.squashed, this.stacked, this.sill, this.posts);
  }

  /** Lay out the blinds raised by `raised` lines (0-160) */
  update(raised: number) {
    // Every 8 lines raised another slat is fully squashed onto the stack, and
    // the remainder is how far the next one has been squashed
    const stackedSlats = Math.floor(raised / SLAT.length);
    const squashedRows = raised % SLAT.length;

    let y = 1;
    let remaining = BLINDS_LINES;
    let lowest: TilingSprite | undefined;
    const place = (sprite: TilingSprite, wanted: number) => {
      const lines = Math.min(remaining, wanted);
      remaining -= lines;
      sprite.visible = lines > 0;
      sprite.y = y;
      sprite.height = lines;
      y += lines;
      if (lines > 0) lowest = sprite;
    };

    // Once a slat has been stacked the hanging slats get one line back; the
    // original's kernel compares one line late
    place(this.slats, BLINDS_LINES - stackedSlats * SLAT.length + (stackedSlats > 0 ? 1 : 0));
    for (const sprite of this.squashed) sprite.visible = false;
    const squashed = this.squashed[squashedRows];
    if (squashed) place(squashed, SLAT.length - squashedRows);
    // One edge-on line per stacked slat, plus the bottom rail
    this.stacked.tilePosition.y = stackedSlats % 2;
    place(this.stacked, stackedSlats + 1);

    // When the blinds reach the bottom, the line under them repeats their last line
    this.sill.visible = remaining === 0 && lowest !== undefined;
    if (lowest && remaining === 0) {
      this.sill.texture = lowest.texture;
      this.sill.tilePosition.y = lowest.tilePosition.y - (lowest.height - 1);
      this.sill.y = y++;
    }

    this.posts.clear();
    for (const x of POSTS.offsets) this.posts.rect(x, 0, POSTS.width, y);
    this.posts.fill(POSTS.colour);
  }
}
