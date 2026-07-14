/**
 * PressurePlate.ts — a Source powered while something heavy rests on it.
 *
 * Room 1's input: shove the battery on, power flows. Step off, it stops. The
 * plate depresses visibly so the cause is legible without words.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import { Source } from "@/systems/logic/SignalGraph";

export class PressurePlate {
  readonly source = new Source(false);
  readonly bounds: Phaser.Geom.Rectangle;
  private cap: Phaser.GameObjects.Rectangle;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, w = 90) {
    this.baseY = y;
    this.bounds = new Phaser.Geom.Rectangle(x - w / 2, y - 20, w, 40);
    scene.add.rectangle(x, y + 10, w + 16, 16, COLOR.metalDark).setDepth(6);
    this.cap = scene.add.rectangle(x, y, w, 18, COLOR.metal).setDepth(7).setStrokeStyle(2, COLOR.metalDark);
  }

  /** Feed the position/size of the pushable; sets power if it overlaps. */
  check(px: number, py: number, pr: number): void {
    const on = Phaser.Geom.Rectangle.Overlaps(
      this.bounds,
      new Phaser.Geom.Rectangle(px - pr, py - pr, pr * 2, pr * 2)
    );
    this.source.set(on);
    this.cap.setY(on ? this.baseY + 8 : this.baseY);
    this.cap.setFillStyle(on ? COLOR.wireOn : COLOR.metal);
  }
}
