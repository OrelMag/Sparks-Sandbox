/**
 * Bell.ts — Phase 1, Action.CANCEL (B / red).
 *
 * Drills: press B. A bright red bell that swings and rings; Spark wobbles with
 * glee. B is "cancel/back" in real games — here it's just a joyful noise, which
 * is the right first association: buttons are fun, not scary.
 */

import Phaser from "phaser";
import { Action } from "@/input/Action";
import { XBOX_BUTTON, COLOR } from "@/config/Palette";
import { PressProp } from "./PressProp";
import { InteractContext } from "@/systems/Interactable";

export class Bell extends PressProp {
  private bell: Phaser.GameObjects.Container;
  private clapper: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super({ scene, action: Action.CANCEL, x, y });

    // A dome bell (arc) with a rim and a clapper.
    const dome = scene.add.graphics();
    dome.fillStyle(XBOX_BUTTON.B, 1);
    dome.slice(0, 0, 40, Math.PI, 0, true);
    dome.fillPath();
    dome.fillStyle(XBOX_BUTTON.B, 1);
    dome.fillRect(-40, 0, 80, 10);
    dome.fillStyle(COLOR.metalDark, 1);
    dome.fillCircle(0, -40, 6); // mount
    this.clapper = scene.add.circle(0, 14, 8, COLOR.metalDark);

    this.bell = scene.add.container(x, y, [dome, this.clapper]).setDepth(10);
  }

  protected respond(ctx: InteractContext, ghost: boolean): void {
    // Swing the bell and bounce the clapper.
    this.scene.tweens.add({
      targets: this.bell,
      angle: { from: -14, to: 14 },
      duration: 80,
      yoyo: true,
      repeat: 3,
      ease: "Sine.inOut",
      onComplete: () => this.bell.setAngle(0),
    });
    this.scene.tweens.add({
      targets: this.clapper,
      y: { from: 14, to: 20 },
      duration: 80,
      yoyo: true,
      repeat: 3,
      ease: "Sine.inOut",
    });
    if (!ghost && ctx.spark) ctx.spark.wobble();
  }
}
