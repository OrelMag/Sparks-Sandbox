/**
 * MudBlob.ts — a muddy object Spark washes clean in Phase 3.
 *
 * Cleanliness runs 0 → 1 and is PROGRESSIVE: every droplet that lands nudges it
 * up and the color lerps from mud-brown toward fresh-green, so spraying always
 * visibly does something. It can never get dirtier, never hurt Spark, never fail.
 * When fully clean it gives a happy sparkle. That's the whole interaction.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";

export class MudBlob {
  readonly container: Phaser.GameObjects.Container;
  private blob: Phaser.GameObjects.Arc;
  private cleanliness = 0;
  private done = false;
  readonly radius = 34;

  constructor(
    private scene: Phaser.Scene,
    public x: number,
    public y: number
  ) {
    this.blob = scene.add.circle(0, 0, this.radius, COLOR.mud);
    this.blob.setStrokeStyle(3, 0x6f5539);
    // A couple of drip lumps for character.
    const lump1 = scene.add.circle(-14, 12, 12, COLOR.mud).setStrokeStyle(3, 0x6f5539);
    const lump2 = scene.add.circle(16, 10, 10, COLOR.mud).setStrokeStyle(3, 0x6f5539);
    this.container = scene.add.container(x, y, [lump1, lump2, this.blob]).setDepth(12);
  }

  get isClean(): boolean {
    return this.done;
  }

  /** Apply one droplet's worth of washing. Returns true the frame it completes. */
  wash(amount = 0.04): boolean {
    if (this.done) return false;
    this.cleanliness = Math.min(1, this.cleanliness + amount);

    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(COLOR.mud),
      Phaser.Display.Color.ValueToColor(COLOR.mudClean),
      100,
      Math.floor(this.cleanliness * 100)
    );
    const tint = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
    for (const c of this.container.list) {
      (c as Phaser.GameObjects.Arc).setFillStyle(tint);
    }

    // A tiny jiggle so each hit reads as contact.
    this.container.setScale(1 + Math.sin(this.cleanliness * 30) * 0.02);

    if (this.cleanliness >= 1) {
      this.finish();
      return true;
    }
    return false;
  }

  private finish(): void {
    this.done = true;
    this.container.setScale(1);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 5, COLOR.sparkGlow).setDepth(30);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(ang) * 50,
        y: this.y + Math.sin(ang) * 50,
        alpha: 0,
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }
    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1.2, to: 1 },
      duration: 300,
      ease: "Back.out",
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
