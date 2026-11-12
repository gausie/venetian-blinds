import { Container, Graphics } from "pixi.js";
import { Blinds, MAX_RAISED, railY, SLAT } from "../../components/Blinds";
import { createGore } from "./Gore";
import { Portrait } from "./Portrait";
import { Rip } from "./Rip";
import { Ritual } from "./Ritual";
import { createRoom } from "./Room";
import { Tapping } from "./Tapping";

// The same frame and four panes as the view from inside
const FRAME = { side: 12, top: 16, bottom: 16, colour: 0x493500 } as const;
const GLASS = { width: 32, height: 108 } as const;
const MULLION = { x: 16, colour: 0x000000 } as const;
const GLAZING_BAR = { y: 54, lines: 2, colour: 0x210b00 } as const;
// Hung high and off to one side, so the frame cuts off its top and edge
const PORTRAIT = { x: 21, y: -3 } as const;
const TAP_ON_GLASS = { x: 6, y: 36 } as const;
/** How far down the glass the rail gets before the hand grabs it */
const RIP_AT = 2 / 3;
// As wide as the inside wall's window, centred on the glass
const BLINDS_X = FRAME.side + (GLASS.width - 64) / 2;
// Fully raised, the blinds' rail tucks just above the glass
const BLINDS_Y = FRAME.top - railY(MAX_RAISED);

export class OutsideWindow extends Container {
  static readonly WIDTH = GLASS.width + 2 * FRAME.side;
  static readonly HEIGHT = FRAME.top + GLASS.height + FRAME.bottom;
  /** In the window's pixels */
  static readonly GLASS = { x: FRAME.side, y: FRAME.top, ...GLASS } as const;

  readonly portrait = new Portrait();
  private readonly blinds = new Blinds({ posts: false });
  private readonly gore = createGore(GLASS.width, GLASS.height);
  private readonly ritual = new Ritual();
  private readonly tapping: Tapping;
  private readonly rip = new Rip();
  private ripArmed = false;
  private isRipped = false;
  private lastRaised = 0;
  private readonly bars: Graphics;
  private readonly broken = new Graphics();

  constructor() {
    super();
    // The slats hang every 8 lines from a line below the blinds' top edge
    const tapY = FRAME.top + TAP_ON_GLASS.y;
    const slatY = BLINDS_Y + 1 + Math.floor((tapY - BLINDS_Y - 1) / 8) * 8;
    this.tapping = new Tapping({ x: FRAME.side + TAP_ON_GLASS.x, y: tapY }, slatY);
    const frame = new Graphics().rect(0, 0, OutsideWindow.WIDTH, OutsideWindow.HEIGHT).fill(FRAME.colour);
    const room = createRoom(GLASS.width, GLASS.height);
    room.position.set(FRAME.side, FRAME.top);
    this.portrait.position.set(FRAME.side + PORTRAIT.x, FRAME.top + PORTRAIT.y);
    this.blinds.position.set(BLINDS_X, BLINDS_Y);
    // Clipped to the glass, so the frame hides anything past it
    const glass = new Graphics().rect(FRAME.side, FRAME.top, GLASS.width, GLASS.height).fill(0xffffff);
    const behind = new Container();
    this.gore.position.copyFrom(room.position);
    this.ritual.position.copyFrom(room.position);
    this.gore.visible = false;
    this.ritual.visible = false;
    behind.addChild(room, this.gore, this.portrait, this.ritual, this.blinds, this.tapping, this.rip);
    behind.mask = glass;
    this.bars = new Graphics()
      .rect(FRAME.side + MULLION.x, FRAME.top, 1, GLASS.height)
      .fill(MULLION.colour)
      .rect(FRAME.side, FRAME.top + GLAZING_BAR.y, GLASS.width, GLAZING_BAR.lines)
      .fill(GLAZING_BAR.colour);
    this.broken.visible = false;
    this.addChild(frame, behind, glass, this.bars, this.broken);
  }

  /** The point is in the window's own pixels */
  isOnGlass({ x, y }: { x: number; y: number }) {
    const gx = x - FRAME.side;
    const gy = y - FRAME.top;
    return gx >= 0 && gx < GLASS.width && gy >= 0 && gy < GLASS.height;
  }

  ransack() {
    this.portrait.empty();
    this.gore.visible = true;
    this.ritual.visible = true;
  }

  shatter() {
    this.bars.visible = false;
    const g = this.broken.clear();
    const colours = [0xe8f4ff, 0xb0d0f0, 0x80a8d0];
    const edge = (x: number, y: number, depth: number, across: boolean, i: number) => {
      const colour = colours[i % colours.length] ?? 0xe8f4ff;
      if (across) g.rect(x, y, 1, depth).fill(colour);
      else g.rect(x, y, depth, 1).fill(colour);
    };
    for (let x = 0; x < GLASS.width; x++) {
      const corner = Math.min(x, GLASS.width - 1 - x);
      const depth = Math.max(0, 6 - corner) + ((x * 7) % 4);
      edge(FRAME.side + x, FRAME.top, depth, true, x);
      edge(FRAME.side + x, FRAME.top + GLASS.height - depth, depth, true, x + 1);
    }
    for (let y = 0; y < GLASS.height; y += 2) {
      const depth = 1 + ((y * 5) % 3);
      edge(FRAME.side, FRAME.top + y, depth, false, y);
      edge(FRAME.side + GLASS.width - depth, FRAME.top + y, depth, false, y + 1);
    }
    this.broken.visible = true;
  }

  get ripped() {
    return this.isRipped;
  }

  get ransacked() {
    return this.gore.visible;
  }

  ripNextTimeDown() {
    if (!this.isRipped) this.ripArmed = true;
  }

  saveStory() {
    return { portrait: this.portrait.saveStory(), ransacked: this.ransacked, ripped: this.isRipped };
  }

  restoreStory(state: ReturnType<OutsideWindow["saveStory"]>) {
    this.portrait.restoreStory(state.portrait);
    if (state.ransacked) this.ransack();
    if (state.ripped) this.tearAway();
  }

  private tearAway() {
    this.isRipped = true;
    this.blinds.visible = false;
    this.rip.showRemnants(this.remnantsAt());
  }

  /** The glass's right edge, and the first slat that starts on the glass rather than above it */
  private remnantsAt() {
    const firstSlat = BLINDS_Y + 1 + Math.ceil((FRAME.top - BLINDS_Y - 1) / SLAT.length) * SLAT.length;
    return { right: FRAME.side + GLASS.width, firstSlat };
  }

  tap() {
    this.tapping.start();
  }

  /** `realSeconds` is unscaled by dev mode, for anything that keeps time with sound */
  update(raised: number, seconds: number, realSeconds: number) {
    this.tapping.tick(realSeconds);
    this.portrait.tick(seconds);
    // Real time, dev mode or not
    this.ritual.tick(realSeconds);

    const lowering = raised < this.lastRaised;
    this.lastRaised = raised;
    const rail = BLINDS_Y + railY(raised);
    if (this.ripArmed && lowering && rail >= FRAME.top + GLASS.height * RIP_AT) {
      this.ripArmed = false;
      this.rip.start(FRAME.side, Math.round((FRAME.top + rail) / 2), this.remnantsAt());
    }
    // While it has hold of them, the hand moves the blinds, not whoever's lowering them
    if (this.rip.active) {
      // Real time, so it can be seen even in dev mode
      const { x, y, done } = this.rip.tick(realSeconds);
      this.blinds.position.set(BLINDS_X - x, BLINDS_Y + y);
      if (done) this.tearAway();
      return;
    }
    if (!this.isRipped) this.blinds.update(raised);
  }
}
