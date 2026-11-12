import { Container, Graphics, Texture, TilingSprite } from "pixi.js";
import { rgba, textureFromRgba } from "../art/textures";

const WIDTH = 64;

/** Lines the blinds can cover below the window's top edge */
export const BLINDS_LINES = 176;

/** The blinds' top edge, slats, and the line under them, when fully down */
export const BLINDS_SIZE = { width: WIDTH, height: 1 + BLINDS_LINES + 1 } as const;

/** How far the blinds can be raised, in lines */
export const MAX_RAISED = 160;

export const SLAT = [0x000000, 0x2c2c2c, 0x535353, 0x777777, 0x9a9a9a, 0xbcbcbc, 0xdedede, 0xffffff];
/** The slat being squashed onto the stack, by how many lines it has been squashed */
const SQUASHED_SLATS = [
  SLAT,
  [0x000000, 0x000000, 0x2c2c2c, 0x535353, 0x777777, 0x9a9a9a, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x2c2c2c, 0x535353, 0x9a9a9a, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x2c2c2c, 0x777777, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x2c2c2c, 0xbcbcbc, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x777777, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0xffffff],
  [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000],
] as const;
/** Lines of each section of the blinds, top to bottom, when raised by `raised` lines */
function sections(raised: number) {
  // Every 8 lines raised another slat is fully squashed onto the stack, and
  // the remainder is how far the next one has been squashed
  const stackedSlats = Math.floor(raised / SLAT.length);
  const squashedRows = raised % SLAT.length;
  let remaining = BLINDS_LINES;
  const take = (wanted: number) => {
    const lines = Math.min(remaining, wanted);
    remaining -= lines;
    return lines;
  };
  // The original gives the hanging slats a line back once any are stacked
  const slats = take(BLINDS_LINES - stackedSlats * SLAT.length + (stackedSlats > 0 ? 1 : 0));
  const squashed = take(SLAT.length - squashedRows);
  // One edge-on line per stacked slat, plus the bottom rail
  const stacked = take(stackedSlats + 1);
  return { stackedSlats, squashedRows, slats, squashed, stacked, reachesSill: remaining === 0 };
}

/** Lines from the top of the window to below the bottom rail */
export function railY(raised: number) {
  const { slats, squashed, stacked } = sections(raised);
  return 1 + slats + squashed + stacked;
}

/**
 * The position that brings the bottom rail to `y`, or as close above it as it
 * gets; the rail doesn't move evenly as the blinds rise
 */
export function raisedForRailY(y: number) {
  let raised = 0;
  while (raised < MAX_RAISED && railY(raised) > y) raised++;
  return raised;
}

/** Slats stacked on the bottom rail alternate edge-on white and black */
const STACKED_SLAT = [0xffffff, 0x000000];

const POSTS = { offsets: [16, 44], width: 4, colour: 0x6d5a00 } as const;

const stripes = (colours: readonly number[]) => textureFromRgba(1, colours.length, colours.flatMap(rgba));
const tiling = (texture = Texture.EMPTY) => new TilingSprite({ texture, width: WIDTH, visible: false });

// Each squashed pattern only shows from its own row onwards
const SQUASHED_TEXTURES = SQUASHED_SLATS.map((pattern, row) => stripes(pattern.slice(row)));

/**
 * Slats hanging from the top of the window, the slat being squashed onto the
 * bottom rail, and the slats already stacked on it. Below that, the view.
 */
export class Blinds extends Container {
  private readonly slats = tiling(stripes(SLAT));
  private readonly squashed = tiling();
  private readonly stacked = tiling(stripes(STACKED_SLAT));
  private readonly sill = tiling();
  // Drawn 1px high and stretched to the height of the blinds
  private readonly posts = new Graphics();
  private raised = -1;

  /** `posts`: the supports the slats hang from, only seen from inside */
  constructor({ posts = true } = {}) {
    super();
    this.posts.visible = posts;
    // The window's top edge, above the first slat
    const edge = new Graphics().rect(0, 0, WIDTH, 1).fill(0x000000);
    for (const x of POSTS.offsets) this.posts.rect(x, 0, POSTS.width, 1);
    this.posts.fill(POSTS.colour);
    this.addChild(edge, this.slats, this.squashed, this.stacked, this.sill, this.posts);
  }

  update(raised: number) {
    // Called every frame, but the blinds only change when they move
    if (raised === this.raised) return;
    this.raised = raised;

    const { stackedSlats, squashedRows, slats, squashed, stacked, reachesSill } = sections(raised);
    let y = 1;
    let lowest: TilingSprite | undefined;
    const place = (sprite: TilingSprite, lines: number) => {
      sprite.visible = lines > 0;
      sprite.y = y;
      sprite.height = lines;
      y += lines;
      if (lines > 0) lowest = sprite;
    };

    place(this.slats, slats);
    this.squashed.texture = SQUASHED_TEXTURES[squashedRows] ?? Texture.EMPTY;
    place(this.squashed, squashed);
    this.stacked.tilePosition.y = stackedSlats % 2;
    place(this.stacked, stacked);

    // When the blinds reach the bottom, the line under them repeats their last line
    this.sill.visible = false;
    if (reachesSill && lowest) {
      this.sill.visible = true;
      this.sill.texture = lowest.texture;
      this.sill.tilePosition.y = lowest.tilePosition.y - (lowest.height - 1);
      this.sill.y = y++;
    }

    this.posts.scale.y = y;
  }
}
