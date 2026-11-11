import { Container } from "pixi.js";
import { Blinds } from "./Blinds";
import { createCord } from "./Cord";
import { createView } from "./View";

/** The view outside, the blinds over it, and the pull cord in front */
export class Window extends Container {
  private readonly blinds = new Blinds();

  constructor() {
    super({ x: 48, y: 5 });
    this.addChild(createView(), this.blinds, createCord());
  }

  update(raised: number) {
    this.blinds.update(raised);
  }
}
