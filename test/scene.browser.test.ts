import { expect, test } from "vitest";
import { SCREEN } from "../src/app";
import screenshotUrl from "./fixtures/archive-screenshot.png?url";
import { renderPixels } from "./render-pixels";

async function loadScreenshot() {
  const bitmap = await createImageBitmap(await (await fetch(screenshotUrl)).blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

test("closed blinds match the archive.org screenshot pixel for pixel", async () => {
  const pixels = await renderPixels(0);

  // The screenshot is scaled 4x horizontally and 2x vertically
  const shot = await loadScreenshot();
  expect([shot.width, shot.height]).toEqual([SCREEN.width * 4, SCREEN.height * 2]);
  let mismatches = 0;
  for (let y = 0; y < shot.height; y++) {
    for (let x = 0; x < shot.width; x++) {
      const s = (y * shot.width + x) * 4;
      const p = ((y >> 1) * SCREEN.width + (x >> 2)) * 4;
      if ([0, 1, 2].some((c) => shot.data[s + c] !== pixels[p + c])) mismatches++;
    }
  }
  expect(mismatches).toBe(0);
});
