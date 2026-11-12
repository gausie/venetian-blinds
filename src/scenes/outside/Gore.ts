import { Graphics } from "pixi.js";
import { mix, roll } from "../../art/colour";
import { FLOOR_Y } from "./Room";

const BLOOD = [0x5a0006, 0x8a000a, 0x6e0008, 0x3a0204] as const;
const WET = 0xc01018;
const FLESH = [0xc06070, 0x9a3a48] as const;
const BONE = 0xe8e0c8;

/** Splatters on the wall as [x, y, radius] */
const SPLATTERS = [
  [6, 12, 4],
  [20, 6, 3],
  [27, 22, 5],
  [11, 28, 3],
] as const;

export function createGore(width: number, height: number) {
  const g = new Graphics();
  const blood = (x: number, y: number) => BLOOD[roll(x, y, 41, BLOOD.length)] ?? BLOOD[0];

  for (let x = 0; x < width; x++) {
    if (roll(x, 0, 42, 3) === 0) continue;
    const length = 4 + roll(x, 0, 43, FLOOR_Y);
    g.rect(x, 0, 1, length).fill(blood(x, 0));
    g.rect(x, length, 1, 2).fill(WET);
  }

  for (const [cx, cy, r] of SPLATTERS) {
    for (let y = cy - r * 2; y <= cy + r * 2; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        // Pixels are twice as wide as tall
        const d = Math.hypot(x - cx, (y - cy) / 2) / r;
        const odds = d < 0.6 ? 1 : d < 1.2 ? 3 : 9;
        if (x >= 0 && x < width && y >= 0 && y < FLOOR_Y && roll(x, y, 44, odds) === 0) {
          g.rect(x, y, 1, 1).fill(d < 0.6 ? blood(x, y) : WET);
        }
      }
    }
  }

  for (let y = FLOOR_Y; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (roll(x, y, 45, 9) === 0) continue;
      const sheen = roll(x, y, 46, 17) === 0;
      g.rect(x, y, 1, 1).fill(sheen ? mix(WET, 0xffffff, 0.2) : blood(x, y));
    }
  }

  for (let y = FLOOR_Y + 3; y < height - 2; y += 3) {
    for (let x = 0; x < width; x++) {
      const pick = roll(x, y, 47, 90);
      if (pick === 0) g.rect(x, y, 1, 2).fill(BONE);
      else if (pick < 4) g.rect(x, y, pick === 1 ? 2 : 1, 2).fill(FLESH[pick % FLESH.length] ?? FLESH[0]);
    }
  }
  return g;
}
