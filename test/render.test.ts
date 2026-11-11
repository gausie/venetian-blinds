import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { expect, test } from "vitest";
import { createState } from "../src/demo";
import { HEIGHT, WIDTH, renderFrame } from "../src/render";

// Minimal decoder for the 8-bit RGBA screenshot archive.org serves
function decodePng(file: Buffer) {
  let pos = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (pos < file.length) {
    const len = file.readUInt32BE(pos);
    const type = file.toString("ascii", pos + 4, pos + 8);
    const data = file.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") [width, height] = [data.readUInt32BE(0), data.readUInt32BE(4)];
    if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      const p = a + b - c;
      const paeth =
        Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c)
          ? a
          : Math.abs(p - b) <= Math.abs(p - c)
            ? b
            : c;
      const pred = [0, a, b, (a + b) >> 1, paeth][filter];
      out[y * stride + x] = (v + pred) & 0xff;
    }
  }
  return { width, height, pixels: out };
}

test("closed blinds match the archive.org screenshot pixel for pixel", () => {
  const png = decodePng(readFileSync(new URL("./fixtures/archive-screenshot.png", import.meta.url)));
  expect([png.width, png.height]).toEqual([WIDTH * 4, HEIGHT * 2]);

  const frame = new Uint32Array(WIDTH * HEIGHT);
  renderFrame(createState(), frame);

  let mismatches = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const v = frame[(y >> 1) * WIDTH + (x >> 2)];
      const i = (y * png.width + x) * 4;
      if (png.pixels[i] !== (v & 0xff) || png.pixels[i + 1] !== ((v >> 8) & 0xff) || png.pixels[i + 2] !== ((v >> 16) & 0xff))
        mismatches++;
    }
  }
  expect(mismatches).toBe(0);
});
