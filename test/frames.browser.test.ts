import { expect, test } from "vitest";
import { MAX_RAISED } from "../src/demo";
import { renderPixels } from "./render-pixels";

// Hashes of every distinct frame, recorded when the Pixi scene was verified
// against a scanline-by-scanline port of the ROM's kernel
test("every blind position renders the recorded frame", async () => {
  const hashes: Record<string, string> = {};
  for (let raised = 0; raised <= MAX_RAISED; raised++) {
    const pixels = await renderPixels(raised);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(pixels)));
    hashes[`colour ${raised}`] = Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  expect(hashes).toMatchSnapshot();
});
