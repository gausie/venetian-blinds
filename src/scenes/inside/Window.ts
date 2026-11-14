import { Container } from "pixi.js";
import { BLINDS_SIZE, Blinds } from "../../components/Blinds";
import { createCord } from "./Cord";
import { createView, GLASS } from "./View";

/** The view outside, the blinds over it, and the pull cord in front */
export class Window extends Container {
  static readonly WIDTH = BLINDS_SIZE.width;
  static readonly HEIGHT = BLINDS_SIZE.height;

  private readonly blinds = new Blinds();

  constructor() {
    super();
    this.addChild(createView(), this.blinds, createCord());
  }

  /** In the window's own pixels */
  isOnGlass({ x, y }: { x: number; y: number }) {
    return x >= GLASS.x && x < GLASS.x + GLASS.width && y >= GLASS.y && y < GLASS.y + GLASS.height;
  }

  update(raised: number) {
    this.blinds.update(raised);
  }
}
