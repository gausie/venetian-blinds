import { Container, Graphics, Sprite } from "pixi.js";
import { ease } from "../../art/ease";
import { artTexture } from "../../art/textures";

/** The left half of its face; the right is the mirror image */
const HALF = [
  "....RRRR",
  "..RRrbbb",
  ".Rrbbbbb",
  "Rrbkkkbb",
  "rbkWWWkb",
  "rbkWxWkb",
  "rbbkkkbb",
  "Rrbbbbkk",
  "Rkwwwwww",
  "Rrkwkwkw",
  ".Rrkkkkk",
  "..RRrbbb",
  "...R.r.R",
];
const FACE = HALF.map((row) => row + [...row].reverse().join(""));
const COLOURS = {
  R: 0x5a0006,
  r: 0xa02020,
  b: 0xe8e0c8,
  k: 0x000000,
  W: 0xffffff,
  x: 0xff0000,
  w: 0xf0f0e0,
} as const;
const BONE = { light: 0xe8e0c8, shadow: 0x9a9070, gore: 0x8a000a } as const;
const GLASS = [0xe8f4ff, 0xb0d0f0, 0x80a8d0] as const;

const SECONDS = { wait: 0.5, lunge: 0.4 } as const;
const SHARDS = 28;

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type Shard = Point & { vx: number; vy: number; size: number; colour: number };

/** Smashes through the glass and unfolds out of the window at you */
export class Jumpscare extends Container {
  private readonly body = new Graphics();
  private readonly hands = new Graphics();
  private readonly head = new Sprite({ texture: artTexture(FACE, COLOURS) });
  private readonly shards = new Graphics();
  private readonly hooks: { breakThrough(): void; done(): void };
  private elapsed: number | undefined;
  private glass: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private screen = { width: 0, height: 0 };
  private flying: Shard[] = [];

  constructor(hooks: { breakThrough(): void; done(): void }) {
    super();
    this.hooks = hooks;
    this.head.anchor.set(0.5);
    this.addChild(this.hands, this.body, this.head, this.shards);
    this.visible = false;
  }

  get active() {
    return this.elapsed !== undefined;
  }

  /** In the parent's pixels */
  start(glass: Rect, screen: { width: number; height: number }) {
    this.glass = glass;
    this.screen = screen;
    this.elapsed = 0;
  }

  tick(seconds: number) {
    if (this.elapsed === undefined) return;
    const before = this.elapsed;
    this.elapsed += seconds;
    const t = this.elapsed - SECONDS.wait;
    if (t < 0) return;
    if (before < SECONDS.wait) this.breakThrough();

    const p = Math.min(1, t / SECONDS.lunge);
    // The body unfolds steadily; the head comes slow then sudden
    this.draw(ease(p, 0, 0.7), p ** 3);
    this.flyShards(seconds);
    if (p >= 1) {
      this.elapsed = undefined;
      this.hooks.done();
    }
  }

  private breakThrough() {
    this.visible = true;
    const { x, y, width, height } = this.glass;
    this.flying = Array.from({ length: SHARDS }, () => {
      const sx = x + Math.random() * width;
      const sy = y + Math.random() * height;
      const dx = sx - (x + width / 2);
      const dy = sy - (y + height / 2);
      return {
        x: sx,
        y: sy,
        vx: dx * 6 + (Math.random() - 0.5) * 40,
        vy: dy * 4 + (Math.random() - 0.5) * 80,
        size: 1 + Math.random() * 2,
        colour: GLASS[Math.floor(Math.random() * GLASS.length)] ?? GLASS[0],
      };
    });
    this.hooks.breakThrough();
  }

  /** Both 0 to 1 */
  private draw(unfold: number, approach: number) {
    const { glass, screen } = this;
    const from = { x: glass.x + glass.width / 2, y: glass.y + glass.height * 0.35 };
    const to = { x: screen.width / 2, y: screen.height / 2 };
    const fill = (2 * Math.max(screen.width, screen.height)) / this.head.texture.width;
    const start = (glass.width * 0.7) / this.head.texture.width;
    const scale = start * (fill / start) ** approach;
    const head = { x: from.x + (to.x - from.x) * approach, y: from.y + (to.y - from.y) * approach };
    // Pixels are twice as wide as tall
    this.head.scale.set(scale, scale * 2);
    this.head.position.set(head.x, head.y);

    const grip = glass.y + glass.height * 0.45;
    const leftHand = { x: glass.x - 3, y: grip };
    const rightHand = { x: glass.x + glass.width + 2, y: grip };
    this.hands.clear();
    this.drawHand(leftHand, -1);
    this.drawHand(rightHand, 1);

    const g = this.body.clear();
    const neck = { x: head.x, y: head.y + 7 * scale * 2 };
    const shoulder = (side: number) => ({ x: head.x + side * 9 * scale, y: neck.y + 2 * scale * 2 });
    const thick = Math.max(1, scale * 1.2);
    for (const [side, hand] of [
      [-1, leftHand],
      [1, rightHand],
    ] as const) {
      const from = shoulder(side);
      // Elbows jut up and out, like a spider's
      const elbow = {
        x: (from.x + hand.x) / 2 + side * 6 * unfold * Math.max(1, scale),
        y: Math.min(from.y, hand.y) - 14 * unfold * Math.max(1, scale),
      };
      this.bone(g, from, elbow, thick);
      this.bone(g, elbow, hand, Math.max(1, thick * 0.7));
    }
    const tail = { x: from.x + (head.x - from.x) * 0.3, y: neck.y + (20 + 30 * unfold) * scale };
    this.bone(g, neck, tail, thick);
    for (let i = 1; i <= 5; i++) {
      const along = i / 6;
      const at = { x: neck.x + (tail.x - neck.x) * along, y: neck.y + (tail.y - neck.y) * along };
      const reach = (7 - i) * scale * unfold;
      this.bone(
        g,
        { x: at.x - reach, y: at.y + scale },
        { x: at.x + reach, y: at.y + scale },
        Math.max(1, thick * 0.6),
      );
    }
  }

  /** Fingers curled round the frame, facing `side` */
  private drawHand({ x, y }: Point, side: number) {
    const g = this.hands;
    g.rect(x - 1, y - 3, 3, 8).fill(BONE.shadow);
    for (let finger = 0; finger < 4; finger++) {
      const fy = y - 4 + finger * 3;
      g.rect(x + side * 2, fy, 2, 1).fill(BONE.light);
      g.rect(x + side * 3, fy + 1, 1, 2).fill(BONE.light);
    }
    g.rect(x, y + 4, 1, 2).fill(BONE.gore);
  }

  /** `thick` pixels wide, and twice as many lines */
  private bone(g: Graphics, a: Point, b: Point, thick: number) {
    const steps = Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y) / 2, 1));
    for (let i = 0; i <= steps; i++) {
      const x = a.x + ((b.x - a.x) * i) / steps;
      const y = a.y + ((b.y - a.y) * i) / steps;
      g.rect(Math.round(x - thick / 2), Math.round(y - thick), Math.ceil(thick), Math.ceil(thick * 2));
    }
    g.fill(BONE.light);
  }

  private flyShards(seconds: number) {
    const g = this.shards.clear();
    for (const shard of this.flying) {
      shard.x += shard.vx * seconds;
      shard.y += shard.vy * seconds;
      shard.size *= 1 + seconds * 4;
      g.rect(Math.round(shard.x), Math.round(shard.y), Math.ceil(shard.size), Math.ceil(shard.size * 2)).fill(
        shard.colour,
      );
    }
  }
}
