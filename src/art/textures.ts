import { BufferImageSource, Texture } from "pixi.js";

export const rgba = (colour: number) => [(colour >> 16) & 0xff, (colour >> 8) & 0xff, colour & 0xff, 0xff];

export const textureFromRgba = (width: number, height: number, pixels: number[]) =>
  new Texture({
    // Every pixel is opaque or fully clear, so the bytes are already premultiplied
    source: new BufferImageSource({
      resource: new Uint8Array(pixels),
      width,
      height,
      scaleMode: "nearest",
      alphaMode: "premultiplied-alpha",
    }),
  });

type Colours = Readonly<Partial<Record<string, number>>>;

/** Rows of characters, each mapped to a colour; anything unmapped is clear and skipped */
export function artPixels(art: readonly string[], colours: Colours) {
  return art.flatMap((row, y) =>
    [...row].flatMap((pixel, x) => {
      const colour = colours[pixel];
      return colour === undefined ? [] : [{ x, y, colour }];
    }),
  );
}

export function artTexture(art: readonly string[], colours: Colours) {
  const width = art[0]?.length ?? 0;
  const pixels = new Array<number>(width * art.length * 4).fill(0);
  for (const { x, y, colour } of artPixels(art, colours)) pixels.splice((y * width + x) * 4, 4, ...rgba(colour));
  return textureFromRgba(width, art.length, pixels);
}
