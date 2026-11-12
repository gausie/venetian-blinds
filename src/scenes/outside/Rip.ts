import { Container, Graphics, Sprite } from "pixi.js";
import { artTexture } from "../../art/textures";
import { SLAT } from "../../components/Blinds";

/** Bony fingers reaching in from the left, shreds of flesh on the bones */
const HAND = {
  art: [
    "RRb.bbbb....",
    "rbbbbbbbbbb.",
    "Rbkbbbr....b",
    "rbbbbbbbbbbb",
    "RRbrbbbb...b",
    "rbbbbbbbbbb.",
    "Rbbbbbr.....",
    "rrbbbbbbbb..",
  ],
  colours: { b: 0xe8e0c8, k: 0x9a9070, r: 0xa02020, R: 0x5a0006 },
  // Nearly as wide as the glass; pixels are twice as wide as tall
  scale: { x: 2, y: 4 },
} as const;

const PHASE_SECONDS = { reach: 0.12, wrench: 0.3, yank: 0.22 } as const;
/** Enough to clear the glass */
const DRAG = 90;

/** Slat ends left hanging: pixels long, and how many at the torn end droop */
const REMNANTS = [
  { length: 14, droop: 6 },
  { length: 9, droop: 5 },
  { length: 5, droop: 4 },
] as const;

/** A huge hand from behind the wall that tears the blinds out sideways */
export class Rip extends Container {
  private readonly hand = new Sprite({ texture: artTexture(HAND.art, HAND.colours) });
  private readonly remnants = new Graphics();
  private elapsed: number | undefined;
  private from = 0;
  private to = 0;
  private gripY = 0;
  private remnantsAt = { right: 0, firstSlat: 0 };

  constructor() {
    super();
    this.hand.scale.set(HAND.scale.x, HAND.scale.y);
    this.hand.visible = false;
    this.remnants.visible = false;
    this.addChild(this.remnants, this.hand);
  }

  get active() {
    return this.elapsed !== undefined;
  }

  /** In the parent's pixels */
  start(left: number, gripY: number, remnants: { right: number; firstSlat: number }) {
    this.remnantsAt = remnants;
    this.from = left - this.hand.width;
    this.to = left + 4 - this.hand.width / 2;
    this.gripY = gripY - this.hand.height / 2;
    this.hand.y = this.gripY;
    this.elapsed = 0;
    this.hand.visible = true;
  }

  /** `right` is the glass's right edge; `torn` from 0 to 1 */
  showRemnants({ right, firstSlat }: { right: number; firstSlat: number }, torn = 1) {
    const g = this.remnants.clear();
    REMNANTS.forEach(({ length, droop }, i) => {
      const top = firstSlat + i * SLAT.length;
      for (let along = 0; along < length; along++) {
        const x = right - 1 - along;
        // Only the torn end sags, more the further along it is
        const sag = Math.round(Math.max(0, along - (length - droop)) * 2 * torn);
        // A ragged tip: the last pixel loses its top half
        const skip = along === length - 1 ? SLAT.length / 2 : 0;
        SLAT.forEach((colour, row) => {
          if (row >= skip) g.rect(x, top + row + sag, 1, 1).fill(colour);
        });
      }
    });
    this.remnants.visible = true;
  }

  /** How far the blinds have been dragged, and whether they're gone */
  tick(seconds: number) {
    if (this.elapsed === undefined) return { x: 0, y: 0, done: false };
    this.elapsed += seconds;
    const t = this.elapsed;
    const { reach, wrench, yank } = PHASE_SECONDS;
    let x = 0;
    let y = 0;
    if (t < reach) {
      this.hand.x = Math.round(this.from + (this.to - this.from) * (t / reach));
    } else if (t < reach + wrench) {
      const jerk = Math.floor((t - reach) * 25);
      x = jerk % 2 ? 3 : -1;
      y = jerk % 3 === 0 ? 2 : -1;
    } else {
      const progress = Math.min(1, (t - reach - wrench) / yank);
      x = Math.round(DRAG * progress ** 2);
      // Down as well as away, as if hauled off towards the floor
      y = Math.round(x * 0.9);
      // The ends that stay behind sag as the rest is torn away
      this.showRemnants(this.remnantsAt, progress);
    }
    if (t >= reach) {
      this.hand.x = this.to - x;
      this.hand.y = this.gripY + y;
    }
    const done = t >= reach + wrench + yank;
    if (done) {
      this.elapsed = undefined;
      this.hand.visible = false;
    }
    return { x, y, done };
  }
}
