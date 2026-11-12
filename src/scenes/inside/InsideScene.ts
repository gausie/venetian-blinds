import { Graphics } from "pixi.js";
import { railY } from "../../components/Blinds";
import { BorderedScene, type Frame, type Size } from "../../components/BorderedScene";
import type { SceneContext } from "../../director";
import { createInput } from "../../input";
import { WALL_COLOUR } from "../../palette";
import { BlindsControl } from "./BlindsControl";
import { Stare } from "./Stare";
import { GLASS } from "./View";
import { Window } from "./Window";

/** The original */
export class InsideScene extends BorderedScene {
  private readonly backdrop = new Graphics();
  private readonly window = new Window();
  private readonly control = new BlindsControl();
  private readonly readInput = createInput(this);
  private readonly stare: Stare;
  private raised = 0;

  constructor(context: SceneContext) {
    super();
    this.stare = new Stare({ shake: (amount) => this.shake(amount), done: () => context.go("outside") });
    this.wall.addChild(this.backdrop, this.window);

    this.on("pointerdown", (e) => {
      if (this.blindsClear && this.window.isOnGlass(e.getLocalPosition(this.window))) this.stare.start();
    });
    this.on("pointerup", () => this.stare.stop());
    this.on("pointerupoutside", () => this.stare.stop());
  }

  private get blindsClear() {
    return railY(this.raised) <= GLASS.y;
  }

  protected layoutWall(wall: Size) {
    this.backdrop.clear().rect(0, 0, wall.width, wall.height).fill(WALL_COLOUR);
    this.window.position.set(
      Math.floor((wall.width - Window.WIDTH) / 2),
      Math.floor((wall.height - Window.HEIGHT) / 2),
    );
  }

  tick({ deltaTime, deltaMS }: Frame) {
    // Dragging the blinds back over the glass breaks the spell
    if (this.stare.active && !this.blindsClear) this.stare.stop();
    this.stare.tick(deltaMS / 1000);
    this.update(this.control.tick(this.readInput(), deltaTime));
  }

  update(raised: number) {
    this.raised = raised;
    this.window.update(raised);
  }

  override saveStory() {
    return { raised: this.control.saveStory() };
  }

  override restoreStory(state: unknown) {
    const { raised } = state as ReturnType<InsideScene["saveStory"]>;
    this.control.restoreStory(raised);
    this.update(Math.round(raised));
  }

  override leave() {
    this.stare.stop();
  }

  /** `amount` in CSS pixels; the plain wall behind needn't move */
  private shake(amount: number) {
    const jitter = (scale: number) => -Math.round(((Math.random() * 2 - 1) * amount) / scale);
    this.window.pivot.set(jitter(this.scale.x), jitter(this.scale.y));
  }
}
