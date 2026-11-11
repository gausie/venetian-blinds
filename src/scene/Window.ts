import { Container } from "pixi.js";
import { BLINDS_LINES, Blinds } from "./Blinds";
import { createCord } from "./Cord";
import { createView } from "./View";

/** The view outside, the blinds over it, and the pull cord in front */
export class Window extends Container {
  static readonly WIDTH = 64;
  // The top edge, the blinds, and the line under them
  static readonly HEIGHT = 1 + BLINDS_LINES + 1;

  private readonly blinds = new Blinds();

  constructor() {
    super();
    this.addChild(createView(), this.blinds, createCord());
  }

  update(raised: number) {
    this.blinds.update(raised);
  }
}
