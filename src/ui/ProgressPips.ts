/**
 * ProgressPips.ts — quantity shown as things, never as a numeral.
 *
 * "3 of 6 gears" would be a number he can't read. Instead we show six pip icons;
 * collected ones fill in. He reads progress the way he reads a row of stickers.
 * Golden rule 3 in miniature.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";

export class ProgressPips {
  readonly container: Phaser.GameObjects.Container;
  private pips: Phaser.GameObjects.Arc[] = [];
  private filled = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private total: number,
    private fillColor: number = COLOR.gear,
    spacing = 30
  ) {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const width = (total - 1) * spacing;
    for (let i = 0; i < total; i++) {
      const px = -width / 2 + i * spacing;
      const pip = scene.add.circle(px, 0, 9, 0x000000, 0.25).setStrokeStyle(2, this.fillColor, 0.6);
      this.pips.push(pip);
      objs.push(pip);
    }
    this.container = scene.add.container(x, y, objs);
    this.container.setDepth(60);
  }

  /** Fill the next pip. Idempotent past `total`. Returns pip world position. */
  fillNext(): { x: number; y: number } | null {
    if (this.filled >= this.total) return null;
    const pip = this.pips[this.filled];
    pip.setFillStyle(this.fillColor, 1);
    this.container.scene.tweens.add({
      targets: pip,
      scale: { from: 1.6, to: 1 },
      duration: 260,
      ease: "Back.out",
    });
    this.filled++;
    const m = this.container.getWorldTransformMatrix();
    return { x: m.tx + pip.x, y: m.ty + pip.y };
  }

  get isComplete(): boolean {
    return this.filled >= this.total;
  }

  get count(): number {
    return this.filled;
  }

  destroy(): void {
    this.container.destroy();
  }
}
