export const CSS_PIXELS_PER_HAND_PIXEL = 2;

/** A gloved fist, pointer #23 from the Amiga Pointer Archive (heckmeck.de/pointers); the hotspot is its fingertip, top left */
export const HAND = {
  art: [
    "KKK.............",
    "KSSK...KK.......",
    "KSSSK.KSSK......",
    ".KSSSKKSSSK.....",
    "..KSSSSKKSSK....",
    ".KSKSSSSKSSK....",
    ".KSSKSSSSSSK....",
    "..KSSSSSSSSK....",
    ".KSKSSKSSSSKK...",
    ".KSSSSSSSSSSKKKK",
    "..KSSSSSSSSKKRRK",
    ".KSKSKSSSSKKRRKK",
    "..KSSSSSSKKRRKK.",
    "...KKSSSKKRRKK..",
    "....KKKKKRRKK...",
    "........KKKK....",
  ],
  colours: { K: 0x000000, S: 0xffbbaa, R: 0xff0000 },
} as const;

/** The same glove balled up, from behind as it knocks: knuckles on top, thumb tucked on the right */
export const FIST = {
  art: [
    ".......KKK.KKK.....",
    "...KKKKSSSKSSSKK...",
    "..KSSSKSSSKSSSKKK..",
    ".KSSSSSSSSSSSSSSKK.",
    "KSSSSKSSSKSSSKSSSK.",
    "KSSSSKSSSKSSSKSSSK.",
    "KSSSSKSSSKSSSKSSSK.",
    "KSSSSSSSSSSSSSSSSKK",
    "KSSSSSSSSSSSSSSSKSK",
    "KSSSSSSSSSSSSSSSKSK",
    ".KSSSSSSSSSSSSSKSSK",
    ".KSSSSSSSSSSSSSSSK.",
    "..KSSSSSSSSSSSSSSK.",
    "..KSSSSSSSSSSSSSK..",
    "...KSSSSSSSSSSSK...",
    "...KSSSSSSSSSSK....",
    "...KKKSSSSSSKKK....",
    "..KKRRKKKKKKRRKK...",
    ".KRRRRRRRRRRRRRK...",
    ".KKKKRRRRRRRRKKK...",
    "....KKKKKKKKKK.....",
  ],
  colours: HAND.colours,
} as const;
