import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { BASE_COLOURS, LOGO, SCENE_COLOUR, SCENE_GFX, SLAT_TRANSITION } from "./data";
import type { DemoState } from "./demo";
import {
  blindsLayout,
  CORD,
  KERNEL_LINES,
  KERNEL_TOP,
  LOGO_POS,
  PLAYFIELD_WIDTH,
  POSTS,
  SCENE,
  SCREEN,
  WALL_LINES,
  WINDOW,
} from "./layout";
import { hex } from "./palette";

const { left: LEFT, top: TOP } = SCREEN;

function context2d(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");
  return ctx;
}

function rect(x: number, y: number, width: number, height: number, tiaColour: number) {
  const sprite = new Sprite(Texture.WHITE);
  sprite.position.set(x, y);
  sprite.setSize(width, height);
  sprite.tint = hex(tiaColour);
  return sprite;
}

/** 1px wide texture of vertical colour stripes, for tiling the slats */
function stripes(tiaColours: number[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = tiaColours.length;
  const ctx = context2d(canvas);
  tiaColours.forEach((c, y) => {
    ctx.fillStyle = `#${hex(c).toString(16).padStart(6, "0")}`;
    ctx.fillRect(0, y, 1, 1);
  });
  return Texture.from({ resource: canvas, scaleMode: "nearest" });
}

/** One rect per run of set bits in an 8-bit player graphic */
function playerRects(gfx: number, x: number, y: number, height: number, scale: number, tiaColour: number) {
  const out: Sprite[] = [];
  for (let bit = 0; bit < 8; ) {
    if (!((gfx << bit) & 0x80)) {
      bit++;
      continue;
    }
    const start = bit;
    while (bit < 8 && (gfx << bit) & 0x80) bit++;
    out.push(rect(x + start * scale, y, (bit - start) * scale, height, tiaColour));
  }
  return out;
}

const kernelY = (x: number) => TOP + KERNEL_TOP + KERNEL_LINES - x;

/** Outside view, fixed in place; the blinds are drawn over whatever part of it they cover */
function buildView() {
  const view = new Container();
  const winX = LEFT + WINDOW.x;
  // Kernel counter 0 stands in for the line after the kernel, which repeats counter 1
  const top = kernelY(KERNEL_LINES);
  const height = KERNEL_LINES + 1;
  // Reflected PF2: the left half reads bit 0 first, the right half bit 7 first
  view.addChild(...playerRects(reverse(SCENE.frameGfx), winX, top, height, 4, SCENE.frameColour));
  view.addChild(...playerRects(SCENE.frameGfx, winX + 32, top, height, 4, SCENE.frameColour));

  // Group consecutive lines with the same graphics and colour into one band
  for (let x = KERNEL_LINES; x >= 0; ) {
    const gfx = SCENE_GFX[x] ?? 0;
    const c = SCENE_COLOUR[x] ?? 0;
    let end = x;
    while (end - 1 >= 0 && SCENE_GFX[end - 1] === gfx && SCENE_COLOUR[end - 1] === c) end--;
    // Pixi's addChild() throws when given nothing, which a blank GRP1 would do
    for (const band of playerRects(gfx, LEFT + SCENE.x, kernelY(x), x - end + 1, 4, c)) view.addChild(band);
    x = end - 1;
  }

  view.addChild(rect(LEFT + SCENE.mullionX, kernelY(123), 1, 123 - 16 + 1, 0x00));
  return view;
}

const reverse = (v: number) => parseInt(v.toString(2).padStart(8, "0").split("").reverse().join(""), 2);

function buildLogo() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 8;
  const ctx = context2d(canvas);
  ctx.fillStyle = "#fff";
  for (let row = 0; row < 8; row++) {
    LOGO.forEach((column, i) => {
      for (let bit = 0; bit < 8; bit++) {
        if (((column[7 - row] ?? 0) << bit) & 0x80) ctx.fillRect(i * 8 + bit, row, 1, 1);
      }
    });
  }
  const sprite = new Sprite(Texture.from({ resource: canvas, scaleMode: "nearest" }));
  sprite.position.set(LEFT + LOGO_POS.x, TOP + LOGO_POS.line);
  return sprite;
}

export class VenetianBlinds extends Container {
  private wall = rect(LEFT, TOP, PLAYFIELD_WIDTH, WALL_LINES, 0);
  private logo = buildLogo();
  private blinds = new Container();
  private slats = new TilingSprite({ texture: stripes([0, 2, 4, 6, 8, 10, 12, 14]), width: WINDOW.width });
  private transitionTextures = SLAT_TRANSITION.map((row, r) => stripes(row.slice(r)));
  private transition = new TilingSprite({ texture: this.transitionTextures[0] ?? Texture.EMPTY, width: WINDOW.width });
  private stack = new TilingSprite({ texture: stripes([0x0e, 0x00]), width: WINDOW.width });
  private bottomLine = rect(0, 0, WINDOW.width, 1, 0);
  private posts: Sprite[];

  constructor() {
    super();
    const winX = LEFT + WINDOW.x;
    const winTop = TOP + WINDOW.firstLine;

    // The line above the kernel already shows the blinds, in the base playfield colour (black)
    this.blinds.position.set(winX, winTop);
    this.blinds.addChild(rect(0, 0, WINDOW.width, 1, BASE_COLOURS[2]));
    this.blinds.addChild(this.slats, this.transition, this.stack, this.bottomLine);
    this.posts = playerRects(POSTS.gfx, LEFT + POSTS.x, winTop, 1, 4, POSTS.colour);

    const cordX = LEFT + CORD.x;
    const tasselY = kernelY(0);
    this.addChild(
      this.wall,
      buildView(),
      this.blinds,
      ...this.posts,
      ...playerRects(CORD.gfx, cordX, winTop, tasselY - winTop, 1, 0x00),
      ...playerRects(CORD.tasselGfx, cordX, tasselY, 1, 1, 0x00),
      this.logo,
    );
  }

  update(state: DemoState) {
    const mask = state.colourMask;
    this.wall.tint = hex(BASE_COLOURS[3] & mask);
    this.logo.tint = hex(BASE_COLOURS[0] & mask);

    const layout = blindsLayout(state.raised);
    let y = 1;
    const place = (sprite: TilingSprite, height: number) => {
      sprite.y = y;
      sprite.height = height;
      sprite.visible = height > 0;
      y += height;
    };
    place(this.slats, layout.slats);
    this.transition.texture = this.transitionTextures[layout.transitionRow] ?? Texture.EMPTY;
    place(this.transition, layout.transition);
    this.stack.tilePosition.y = layout.stackStartsDark ? 1 : 0;
    place(this.stack, layout.stack);

    this.bottomLine.visible = layout.bottomColour !== null;
    if (layout.bottomColour !== null) {
      this.bottomLine.y = y++;
      this.bottomLine.tint = hex(layout.bottomColour);
    }
    for (const post of this.posts) post.height = y;
  }
}
