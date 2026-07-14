/**
 * Lights.ts — Phase 1, Action.EXTRA (Y / yellow).
 *
 * Drills: press Y. A little marquee of yellow bulbs that flash in a happy chase
 * on each press. Spark's cheeks glow. Y is the fourth face button; pressing it
 * completes the color set so all four thumb positions have been discovered.
 */

import Phaser from "phaser";
import { Action } from "@/input/Action";
import { XBOX_BUTTON } from "@/config/Palette";
import { PressProp } from "./PressProp";
import { InteractContext } from "@/systems/Interactable";

export class Lights extends PressProp {
  private bulbs: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super({ scene, action: Action.EXTRA, x, y });

    const count = 5;
    const span = 120;
    for (let i = 0; i < count; i++) {
      const bx = x - span / 2 + (span / (count - 1)) * i;
      const bulb = scene.add.circle(bx, y, 12, XBOX_BUTTON.Y, 0.35).setDepth(10);
      bulb.setStrokeStyle(3, XBOX_BUTTON.Y, 0.8);
      this.bulbs.push(bulb);
    }
  }

  protected respond(_ctx: InteractContext, ghost: boolean): void {
    // Chase: light each bulb in turn, then fade back to dim.
    this.bulbs.forEach((bulb, i) => {
      this.scene.time.delayedCall(i * 70, () => {
        bulb.setFillStyle(XBOX_BUTTON.Y, 1);
        this.scene.tweens.add({
          targets: bulb,
          scale: { from: 1.4, to: 1 },
          duration: 200,
          ease: "Quad.out",
          onComplete: () => bulb.setFillStyle(XBOX_BUTTON.Y, 0.35),
        });
      });
    });
    if (!ghost && _ctx.spark) {
      // Cheek glow: a quick bright pulse on Spark's body.
      this.scene.tweens.add({
        targets: _ctx.spark.body,
        scale: { from: 1, to: 1.12 },
        duration: 150,
        yoyo: true,
        ease: "Sine.inOut",
      });
    }
  }
}
