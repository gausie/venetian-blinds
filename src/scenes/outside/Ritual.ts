import { Container, Graphics } from "pixi.js";

/** In room pixels, under the portrait and clear of the glazing bar. Squashed, as the floor is seen at a slant: a round circle would have `ry` twice `rx`. */
const CIRCLE = { x: 24, y: 69, rx: 7, ry: 11 } as const;
const CHALK = 0xe0d8c8;
const WAX = 0xe8e0c8;
const FLAME = [0xffe060, 0xffa020, 0xff6010] as const;
const FLICKER_SECONDS = 0.25;

const POINTS = Array.from({ length: 5 }, (_, i) => {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return {
    x: Math.round(CIRCLE.x + CIRCLE.rx * Math.cos(angle)),
    y: Math.round(CIRCLE.y + CIRCLE.ry * Math.sin(angle)),
  };
});

function line(g: Graphics, a: { x: number; y: number }, b: { x: number; y: number }, colour: number) {
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  for (let i = 0; i <= steps; i++) {
    g.rect(Math.round(a.x + ((b.x - a.x) * i) / steps), Math.round(a.y + ((b.y - a.y) * i) / steps), 1, 1);
  }
  g.fill(colour);
}

export class Ritual extends Container {
  private readonly flames = new Graphics();
  private sinceFlicker = 0;

  constructor() {
    super();
    const chalk = new Graphics();
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * 2 * Math.PI;
      chalk.rect(
        Math.round(CIRCLE.x + CIRCLE.rx * Math.cos(angle)),
        Math.round(CIRCLE.y + CIRCLE.ry * Math.sin(angle)),
        1,
        1,
      );
    }
    chalk.fill(CHALK);
    // A star is each point joined to the one two along
    POINTS.forEach((point, i) => {
      const next = POINTS[(i + 2) % POINTS.length];
      if (next) line(chalk, point, next, CHALK);
    });
    const candles = new Graphics();
    for (const { x, y } of POINTS) candles.rect(x, y - 3, 1, 3);
    candles.fill(WAX);
    this.flames.visible = false;
    this.addChild(chalk, candles, this.flames);
    this.flicker();
  }

  get lit() {
    return this.flames.visible;
  }

  light() {
    this.flames.visible = true;
  }

  tick(seconds: number) {
    if (!this.lit) return;
    this.sinceFlicker += seconds;
    if (this.sinceFlicker < FLICKER_SECONDS) return;
    this.sinceFlicker = 0;
    this.flicker();
  }

  private flicker() {
    this.flames.clear();
    for (const { x, y } of POINTS) {
      const height = 1 + Math.floor(Math.random() * 3);
      const colour = FLAME[Math.floor(Math.random() * FLAME.length)] ?? FLAME[0];
      this.flames.rect(x, y - 3 - height, 1, height).fill(colour);
    }
  }
}
