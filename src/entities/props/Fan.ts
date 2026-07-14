/**
 * Fan.ts — Phase 1, Action.ALT (X / blue).
 *
 * Drills: press X. A blue pinwheel fan that spins up on each press and coasts
 * down. Spark leans into the breeze. X is the "alt/use" face button.
 */

import Phaser from "phaser";
import { Action } from "@/input/Action";
import { XBOX_BUTTON, COLOR } from "@/config/Palette";
import { PressProp } from "./PressProp";
import { InteractContext } from "@/systems/Interactable";

export class Fan extends PressProp {
  private blades: Phaser.GameObjects.Container;
  private spin = 0;
  private spinVel = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super({ scene, action: Action.ALT, x, y });

    // Post.
    scene.add.rectangle(x, y + 20, 10, 60, COLOR.metalDark).setDepth(9);

    // Four blades as teardrop ellipses.
    const bladeObjs: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < 4; i++) {
      const b = scene.add.ellipse(0, -22, 20, 40, XBOX_BUTTON.X, 1);
      b.setAngle(i * 90);
      // Offset each blade outward from the hub by rotating its container origin.
      const holder = scene.add.container(0, 0, [b]);
      holder.setAngle(i * 90);
      b.setPosition(0, -22);
      bladeObjs.push(holder);
    }
    const hub = scene.add.circle(0, 0, 10, COLOR.metalDark);
    bladeObjs.push(hub);
    this.blades = scene.add.container(x, y, bladeObjs).setDepth(10);
  }

  protected respond(ctx: InteractContext, ghost: boolean): void {
    // Kick the spin; onFrame coasts it down.
    this.spinVel += ghost ? 6 : 14;
    if (!ghost && ctx.spark) {
      // Spark leans into the breeze.
      this.scene.tweens.add({
        targets: ctx.spark.container,
        angle: { from: 0, to: -10 },
        duration: 120,
        yoyo: true,
        ease: "Sine.inOut",
      });
    }
  }

  protected onFrame(ctx: InteractContext): void {
    if (Math.abs(this.spinVel) < 0.001) return;
    this.spin += this.spinVel * ctx.dt * 60;
    this.spinVel *= 0.94; // coast down
    if (Math.abs(this.spinVel) < 0.02) this.spinVel = 0;
    this.blades.setAngle(this.spin);
  }
}
