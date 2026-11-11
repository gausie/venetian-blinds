import { BASE_COLOURS, LOGO, SCENE_COLOUR, SCENE_GFX, SLAT_TRANSITION } from "./data";
import type { DemoState } from "./demo";
import { colour } from "./palette";

// Same framing as the archive.org player: 160 visible pixels with an 8px
// border either side, 20 blank lines above the first visible kernel line.
export const WIDTH = 176;
export const HEIGHT = 223;
const LEFT = 8;
const TOP = 20;

const P0_X = 54; // cord
const P1_X = 64; // window posts / scene (quad width)
const M0_X = 80; // centre mullion of the window
const LOGO_X = 21;
const KERNEL_LINES = 176;

type Line = {
  bk: number;
  pf: number;
  pfColour: number;
  grp0: number;
  colup0: number;
  grp1: number;
  colup1: number;
  enam0: boolean;
};

// PF2 with CTRLPF reflect: bit 0 is the leftmost of columns 12-19, mirrored for 20-27
const playfieldAt = (pf2: number, x: number) => {
  const col = x >> 2;
  if (col >= 12 && col < 20) return (pf2 >> (col - 12)) & 1;
  if (col >= 20 && col < 28) return (pf2 >> (27 - col)) & 1;
  return 0;
};

const playerAt = (grp: number, pos: number, scale: number, x: number) => {
  const d = x - pos;
  if (d < 0 || d >= 8 * scale) return 0;
  return (grp >> (7 - Math.floor(d / scale))) & 1;
};

export function renderFrame(state: DemoState, out: Uint32Array): void {
  out.fill(colour(0));
  const mask = state.colourMask;
  const [, , pfBase, bkBase, stripBk] = BASE_COLOURS.map((c) => c & mask);
  const logoColour = BASE_COLOURS[0] & mask;

  const lines: Line[] = [];
  const reg: Line = {
    bk: bkBase,
    pf: 0,
    pfColour: pfBase,
    grp0: 0,
    colup0: 0,
    grp1: 0,
    colup1: 0x14,
    enam0: false,
  };
  const emit = () => lines.push({ ...reg });

  for (let i = 0; i < 5; i++) emit();

  // Graphics switch on one line before the first colour write
  Object.assign(reg, { grp0: 0x24, grp1: 0x81, pf: 0xff });
  emit();

  // Slats above the bottom rail, the slat being compressed, the stacked slats,
  // then the scene outside for whatever lines remain
  const raised = state.raised;
  const top = raised & 0xf8;
  let x = KERNEL_LINES;
  for (let y = 0; x >= top && x > 0; y++, x--) {
    reg.pfColour = (y & 7) * 2;
    emit();
  }
  for (let y = raised & 7; y < 8 && x > 0; y++, x--) {
    reg.pfColour = SLAT_TRANSITION[raised & 7][y];
    emit();
  }
  for (let y = raised >> 3; y >= 0 && x > 0; y--, x--) {
    reg.pfColour = y & 1 ? 0x00 : 0x0e;
    emit();
  }
  for (; x > 0; x--) {
    reg.enam0 = x >= 16 && x < 124;
    reg.grp1 = SCENE_GFX[x];
    reg.colup1 = SCENE_COLOUR[x];
    reg.pfColour = 0x12;
    reg.pf = 0x0e;
    emit();
  }

  // Bottom of the cord loop
  reg.grp0 = 0x18;
  emit();
  Object.assign(reg, { grp0: 0, grp1: 0, pf: 0, enam0: false });
  for (let i = 0; i < 5; i++) emit();

  drawLines(lines, out);

  // Logo strip: two players with two close copies each, rewritten mid-line
  const logoTop = TOP + lines.length + 1;
  const stripLines = 1 + LOGO[0].length;
  for (let l = 0; l < stripLines; l++) {
    const row = (logoTop - 1 + l) * WIDTH;
    for (let px = 0; px < 160; px++) out[row + LEFT + px] = colour(stripBk);
  }
  for (let r = 7; r >= 0; r--) {
    const row = (logoTop + 7 - r) * WIDTH;
    const bits = LOGO.reduce<number>((acc, col) => acc * 256 + col[r], 0);
    for (let i = 0; i < 32; i++) {
      if ((bits / 2 ** (31 - i)) & 1) out[row + LEFT + LOGO_X + i] = colour(logoColour);
    }
  }
}

function drawLines(lines: Line[], out: Uint32Array) {
  lines.forEach((l, i) => {
    const row = (TOP + i) * WIDTH + LEFT;
    for (let px = 0; px < 160; px++) {
      let c = l.bk;
      if (playfieldAt(l.pf, px)) c = l.pfColour;
      if (playerAt(l.grp1, P1_X, 4, px)) c = l.colup1;
      if (playerAt(l.grp0, P0_X, 1, px) || (l.enam0 && px === M0_X)) c = l.colup0;
      out[row + px] = colour(c);
    }
  });
}
