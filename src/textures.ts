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
