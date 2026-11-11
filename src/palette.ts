// NTSC palette computed the same way as MAME's TIA (26.2 degree phase shift),
// which is what the archive.org player uses, so colours match its screenshots.
const IQ: [number, number][] = [
  [0.0, 0.0],
  [0.192, -0.127],
  [0.241, -0.048],
  [0.24, 0.04],
  [0.191, 0.121],
  [0.103, 0.175],
  [-0.008, 0.196],
  [-0.116, 0.174],
  [-0.199, 0.118],
  [-0.243, 0.037],
  [-0.237, -0.052],
  [-0.18, -0.129],
  [-0.087, -0.181],
  [0.021, -0.196],
  [0.13, -0.169],
  [0.21, -0.107],
];

const channel = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v) ** 0.9));

// Packed as 0xAABBGGRR so it can be written straight into a Uint32Array over ImageData
export const PALETTE: Uint32Array = (() => {
  const out = new Uint32Array(128);
  IQ.forEach(([i, q], hue) => {
    for (let lum = 0; lum < 8; lum++) {
      const y = lum / 7;
      const r = channel(y + 0.956 * i + 0.621 * q);
      const g = channel(y - 0.272 * i - 0.647 * q);
      const b = channel(y - 1.106 * i + 1.703 * q);
      out[hue * 8 + lum] = (0xff << 24) | (b << 16) | (g << 8) | r;
    }
  });
  return out;
})();

export const colour = (tiaColour: number) => PALETTE[(tiaColour & 0xff) >> 1];
