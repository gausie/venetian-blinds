import { type FederatedPointerEvent, Rectangle } from "pixi.js";
import { BorderedScene, type Frame, type Size } from "../../components/BorderedScene";
import type { SceneContext } from "../../director";
import { playKnock, playScare, playTaps } from "../../sound";
import { BrickWall } from "./BrickWall";
import { Fist, RAPS } from "./Fist";
import { Jumpscare } from "./Jumpscare";
import { OutsideWindow } from "./OutsideWindow";
import { Peek } from "./Peek";
import { TAPS } from "./Tapping";
import { Vigil } from "./Vigil";

export class OutsideScene extends BorderedScene {
  private readonly bricks = new BrickWall();
  private readonly window = new OutsideWindow();
  private readonly fist = new Fist();
  private readonly peek = new Peek();
  /** Once the skeleton's been seen, something taps back once the blinds are down */
  private readonly vigil = new Vigil();
  private sawPortrait = false;
  private sawRansack = false;
  private nextKnockEchoesTaps = false;
  private readonly context: SceneContext;
  private readonly jumpscare: Jumpscare;

  constructor(context: SceneContext) {
    super({ mirrored: true });
    this.context = context;
    this.jumpscare = new Jumpscare({
      breakThrough: () => {
        playScare();
        this.window.shatter();
      },
      done: () => context.go("ending"),
    });
    this.wall.addChild(this.bricks, this.window);
    // Over the border too, wherever the knock lands
    this.addChild(this.fist, this.jumpscare);
    this.on("pointerdown", (e) => this.knock(e));
  }

  private knock(e: FederatedPointerEvent) {
    // No point knocking while they're already looking out, or once it's coming
    if (this.jumpscare.active || !this.peek.closed) return;
    if (!this.window.isOnGlass(e.getLocalPosition(this.window))) return;
    const at = e.getLocalPosition(this);
    const raps = this.nextKnockEchoesTaps ? TAPS : RAPS;
    this.nextKnockEchoesTaps = false;
    this.fist.start(Math.round(at.x), Math.round(at.y), raps);
    playKnock(raps);
    // Decided while the blinds are still down, so it's there when they open
    if (this.sawPortrait) this.window.portrait.worsen();
    if (this.sawRansack) this.window.ritual.light();
    this.vigil.reset();
    if (this.window.ripped) {
      const { x, y, width, height } = OutsideWindow.GLASS;
      const glass = { x: this.wall.x + this.window.x + x, y: this.wall.y + this.window.y + y, width, height };
      this.jumpscare.start(glass, this.screen);
      return;
    }
    this.peek.start(raps.at(-1) ?? 0);
  }

  private addFlaw() {
    const { x, y } = this.window;
    this.bricks.addFlaw(new Rectangle(x, y, OutsideWindow.WIDTH, OutsideWindow.HEIGHT));
  }

  protected layoutWall(wall: Size) {
    this.bricks.layout(wall);
    this.window.position.set(
      Math.floor((wall.width - OutsideWindow.WIDTH) / 2),
      Math.floor((wall.height - OutsideWindow.HEIGHT) / 2),
    );
  }

  tick({ deltaTime, deltaMS }: Frame) {
    const seconds = deltaMS / 1000;
    this.fist.tick(seconds);
    this.jumpscare.tick(seconds);
    const { raised, opened } = this.peek.tick(deltaTime, seconds);
    if (opened) {
      this.sawPortrait = true;
      this.addFlaw();
    }
    if (opened && this.window.portrait.skeletal) this.vigil.arm();
    if (opened && this.sawRansack) this.window.ripNextTimeDown();
    if (opened && this.window.ransacked) this.sawRansack = true;
    // Only counts while the blinds are down, so it happens unseen
    if (this.peek.closed && this.vigil.tick(seconds)) {
      playTaps(TAPS);
      this.window.tap();
      this.window.ransack();
      this.nextKnockEchoesTaps = true;
    }
    this.window.update(raised, seconds);
    // The fist stands in for the pointer while it knocks
    this.context.showPointer(!this.fist.visible);
  }

  override saveStory() {
    return {
      window: this.window.saveStory(),
      bricks: this.bricks.saveStory(),
      vigil: this.vigil.saveStory(),
      sawPortrait: this.sawPortrait,
      sawRansack: this.sawRansack,
    };
  }

  override restoreStory(state: unknown) {
    const saved = state as ReturnType<OutsideScene["saveStory"]>;
    this.window.restoreStory(saved.window);
    this.bricks.restoreStory(saved.bricks);
    this.vigil.restoreStory(saved.vigil);
    this.sawPortrait = saved.sawPortrait;
    this.sawRansack = saved.sawRansack;
  }

  override leave() {
    this.context.showPointer(true);
  }
}
