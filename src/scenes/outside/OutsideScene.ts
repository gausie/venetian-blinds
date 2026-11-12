import { type FederatedPointerEvent, Rectangle } from "pixi.js";
import { chance } from "../../chance";
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

/** Per opening, once the ransacked room has been seen */
const RIP_CHANCE = 0.5;
/** Per knock, once the blinds are gone */
const SCARE_CHANCE = 0.5;

export class OutsideScene extends BorderedScene {
  private readonly bricks = new BrickWall();
  private readonly window = new OutsideWindow();
  private readonly fist = new Fist();
  private readonly peek = new Peek();
  /** Once the skeleton's been seen, leave it too long and something taps back */
  private readonly vigil = new Vigil();
  /** The portrait only turns after you've seen it as it was */
  private answered = false;
  private sawRansack = false;
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
    this.fist.start(Math.round(at.x), Math.round(at.y));
    playKnock(RAPS);
    // Decided while the blinds are still down, so it's there when they open
    if (this.answered) this.window.portrait.worsen();
    this.vigil.reset();
    if (this.window.ripped && chance(SCARE_CHANCE)) {
      const { x, y, width, height } = OutsideWindow.GLASS;
      const glass = { x: this.wall.x + this.window.x + x, y: this.wall.y + this.window.y + y, width, height };
      this.jumpscare.start(glass, this.screen);
      return;
    }
    this.peek.start();
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

  tick({ deltaTime, deltaMS, speed }: Frame) {
    const seconds = deltaMS / 1000;
    this.fist.tick(seconds);
    this.jumpscare.tick(seconds / speed);
    const { raised, opened } = this.peek.tick(deltaTime, seconds, seconds / speed);
    if (opened) {
      this.answered = true;
      this.addFlaw();
    }
    if (opened && this.window.portrait.skeletal) this.vigil.arm();
    if (opened && this.sawRansack && chance(RIP_CHANCE)) this.window.ripNextTimeDown();
    if (opened && this.window.ransacked) this.sawRansack = true;
    // Only counts while the blinds are down, so it happens unseen
    if (this.peek.closed && this.vigil.tick(seconds)) {
      playTaps(TAPS);
      this.window.tap();
      this.window.ransack();
    }
    this.window.update(raised, seconds, seconds / speed);
    // The fist stands in for the pointer while it knocks
    this.context.showPointer(!this.fist.visible);
  }

  override saveStory() {
    return {
      window: this.window.saveStory(),
      bricks: this.bricks.saveStory(),
      vigil: this.vigil.saveStory(),
      answered: this.answered,
      sawRansack: this.sawRansack,
    };
  }

  override restoreStory(state: unknown) {
    const saved = state as ReturnType<OutsideScene["saveStory"]>;
    this.window.restoreStory(saved.window);
    this.bricks.restoreStory(saved.bricks);
    this.vigil.restoreStory(saved.vigil);
    this.answered = saved.answered;
    this.sawRansack = saved.sawRansack;
  }

  override leave() {
    this.context.showPointer(true);
  }
}
