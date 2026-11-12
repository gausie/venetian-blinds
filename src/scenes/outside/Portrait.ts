import { Container, Sprite, type Texture } from "pixi.js";
import { artTexture } from "../../art/textures";
import { chance } from "../../chance";
import { Blood } from "./Blood";

/** Each row is two lines tall */
const ART = [
  "GGGGGGGGGGGGGG",
  "GddddddddddddG",
  "GddddhhhhddddG",
  "GdddhhhhhhdddG",
  "GdddhffffhdddG",
  "GdddfefefhdddG",
  "GdddffnffhdddG",
  "GddddfmmfddddG",
  "GdddddffdddddG",
  "GdddccccccdddG",
  "GddccccwccccdG",
  "GdcccccwcccccG",
  "GGGGGGGGGGGGGG",
];

/** Replacements for ART's rows from row 2 down */
const FACES = {
  normal: [],
  uncanny: [
    "GddddhhhhddddG",
    "GdddhhhhhhdddG",
    "GdddhffffhdddG",
    "GdddfefefhdddG",
    "GdddmfnffmdddG",
    "GdddmwwwwmdddG",
    "GddddmffmddddG",
  ],
  aged: [
    "GddddHHHHddddG",
    "GdddHHHHHHdddG",
    "GdddHaaaaHdddG",
    "GdddaeaeaHdddG",
    "GdddaanaaadddG",
    "GdddlwwwwldddG",
    "GddddaaaaddddG",
  ],
  flayed: [
    "GddddrrrrddddG",
    "GdddrsrrsrdddG",
    "GdddrrsRrrdddG",
    "GdddWxWWxWdddG",
    "GdddrrkkrrdddG",
    "GdddrwwwwrdddG",
    "GddddrssrddddG",
    "GddrsrrrrsrddG",
    "GdrRrsRRsrRrdG",
    "GrRrrsrrsrrRrG",
  ],
  skeletal: [
    "GddddddddddddG",
    "GddddbbbbddddG",
    "GdddbbbbbbdddG",
    "GdddWxbbxWdddG",
    "GddddbkkbddddG",
    "GdddkwwwwkdddG",
    "GddddbwwbddddG",
    "GddddddbdddddG",
    "GdddbkbbkbdddG",
    "GddbkbkbkbkddG",
  ],
} satisfies Record<string, string[]>;

const COLOURS = {
  G: 0xc89c2c, // gilt frame
  d: 0x24301c, // background
  h: 0x3a2010, // hair
  f: 0xe0b088, // skin
  e: 0x101010, // eye
  n: 0xc08868, // nose
  m: 0x8a3030, // lips
  c: 0x202048, // jacket
  w: 0xe8e8e8, // shirt, teeth
  H: 0xb0b0a8, // grey hair
  a: 0xc8a888, // sallow skin
  l: 0x8a6a50, // wrinkles
  r: 0xa02020, // muscle
  R: 0x701010, // deep muscle
  s: 0xe0c0c0, // sinew
  W: 0xffffff, // eyeball
  x: 0xd00000, // bloodshot iris
  k: 0x000000, // hollow
  b: 0xe8e0c8, // bone
} as const;

type Face = keyof typeof FACES;
const ORDER = Object.keys(FACES) as Face[];
const NEXT_STAGE_CHANCE = [0.25, 0.5, 0.75, 0.75] as const;
const BLEEDS_FROM = ORDER.indexOf("flayed");
const POOLS_FROM = ORDER.indexOf("skeletal");

function faceTexture(face: Face) {
  const rows: readonly string[] = FACES[face];
  return artTexture(
    ART.map((base, y) => rows[y - 2] ?? base),
    COLOURS,
  );
}

export class Portrait extends Container {
  private readonly textures: Texture[] = ORDER.map(faceTexture);
  private readonly painting = new Sprite();
  private readonly blood = new Blood();
  private face = 0;
  private isEmpty = false;
  private readonly emptyTexture = artTexture(
    ART.map((row, y) => (y > 1 && y < ART.length - 1 ? "GddddddddddddG" : row)),
    COLOURS,
  );

  constructor() {
    super();
    this.painting.texture = this.textures[0] ?? this.painting.texture;
    this.painting.scale.y = 2;
    // Behind the painting, so it seeps out from under the frame
    this.addChild(this.blood, this.painting);
  }

  get skeletal() {
    return ORDER[this.face] === "skeletal";
  }

  /** The blood stays */
  empty() {
    this.isEmpty = true;
    this.painting.texture = this.emptyTexture;
  }

  saveStory() {
    return { face: this.face, empty: this.isEmpty, blood: this.blood.saveStory() };
  }

  restoreStory(state: ReturnType<Portrait["saveStory"]>) {
    this.face = state.face;
    this.painting.texture = this.textures[this.face] ?? this.painting.texture;
    if (state.empty) this.empty();
    this.blood.restoreStory(state.blood);
  }

  worsen() {
    if (this.face >= ORDER.length - 1 || !chance(NEXT_STAGE_CHANCE[this.face] ?? 0)) return;
    this.face++;
    this.painting.texture = this.textures[this.face] ?? this.painting.texture;
    if (this.face >= BLEEDS_FROM) this.blood.start();
    if (this.face >= POOLS_FROM) this.blood.pool();
  }

  tick(seconds: number) {
    this.blood.tick(seconds);
  }
}
