import { Graphics } from "pixi.js";
import type { Size } from "./BorderedScene";

export class Eyelids extends Graphics {
  private size: Size = { width: 0, height: 0 };
  private amount = 0;

  layout(size: Size) {
    this.size = size;
    this.shut(this.amount);
  }

  /** From 0, wide open, to 1, shut */
  shut(amount: number) {
    this.amount = amount;
    const { width, height } = this.size;
    const lid = Math.ceil((height / 2) * amount);
    this.clear();
    if (lid > 0)
      this.rect(0, 0, width, lid)
        .rect(0, height - lid, width, lid)
        .fill(0x000000);
  }
}
