import { SLAT_TRANSITION } from "./data";

// Screen geometry, in TIA pixels/scanlines. The framing (8px side borders,
// 20 blank lines on top) matches the archive.org player.
export const SCREEN = { width: 176, height: 223, left: 8, top: 20 } as const;
export const PLAYFIELD_WIDTH = 160;
/** Lines of wall above the logo strip */
export const WALL_LINES = 188;
export const WINDOW = { x: 48, width: 64, firstLine: 5 } as const;
/** First line of the 176-line window kernel; the line above it is a black edge */
export const KERNEL_TOP = 6;
export const KERNEL_LINES = 176;
export const CORD = { x: 54, gfx: 0x24, tasselGfx: 0x18 } as const;
export const POSTS = { x: 64, gfx: 0x81, colour: 0x14 } as const;
export const SCENE = { x: 64, frameGfx: 0x0e, frameColour: 0x12, mullionX: 80 } as const;
export const LOGO_POS = { x: 21, line: 189 } as const;

export type BlindsLayout = {
  /** Lines of open slats from the top of the window */
  slats: number;
  /** Which compressed-slat row is shown (raised & 7) and how many of its lines */
  transitionRow: number;
  transition: number;
  /** Lines of stacked slats sitting on the bottom rail */
  stack: number;
  stackStartsDark: boolean;
  /**
   * The line after the kernel repeats the kernel's last line. When the blinds
   * reach that far this is the colour they leave there; null when the scene does.
   */
  bottomColour: number | null;
};

export function blindsLayout(raised: number): BlindsLayout {
  const row = raised & 7;
  const top = raised & 0xf8;
  let remaining = KERNEL_LINES;
  const take = (n: number) => {
    const lines = Math.min(remaining, n);
    remaining -= lines;
    return lines;
  };
  const slats = take(top ? KERNEL_LINES + 1 - top : KERNEL_LINES);
  const transition = take(8 - row);
  const stack = take((raised >> 3) + 1);

  let bottomColour: number | null = null;
  if (remaining === 0) {
    if (stack) bottomColour = ((raised >> 3) - stack + 1) & 1 ? 0x00 : 0x0e;
    else if (transition) bottomColour = SLAT_TRANSITION[row]?.[row + transition - 1] ?? 0;
    else bottomColour = ((slats - 1) & 7) * 2;
  }

  return { slats, transitionRow: row, transition, stack, stackStartsDark: ((raised >> 3) & 1) === 1, bottomColour };
}
