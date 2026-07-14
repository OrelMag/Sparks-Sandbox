/**
 * Bridge.ts — a Sink that extends across a gap while powered.
 *
 * Room 3's payoff. Planks slide in to span a visible chasm when the AND gate is
 * powered (both bumpers held). A barrier blocks passage while retracted; walk
 * away, both bumpers release, the bridge withdraws — no lock-out, no falling
 * (the world soft-clamps regardless).
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import type { SignalNode } from "@/systems/logic/SignalGraph";

export class Bridge {
  private planks: Phaser.GameObjects.Rectangle[] = [];
  private barrier: Phaser.GameObjects.Rectangle;
  private extended = false;

  constructor(
    scene: Phaser.Scene,
    x1: number,
    x2: number,
    private y: number,
    private input: SignalNode
  ) {
    // The chasm.
    scene.add.rectangle((x1 + x2) / 2, y, x2 - x1, 70, COLOR.bgBottom, 1).setDepth(3).setStrokeStyle(2, 0x2a2f4a);

    const n = Math.max(3, Math.floor((x2 - x1) / 40));
    for (let i = 0; i < n; i++) {
      const px = Phaser.Math.Linear(x1 + 20, x2 - 20, i / (n - 1));
      const plank = scene.add.rectangle(px, y + 90, 34, 16, COLOR.gearDark).setDepth(9).setAlpha(0);
      this.planks.push(plank);
    }

    this.barrier = scene.add.rectangle((x1 + x2) / 2, y, x2 - x1, 60, 0x000000, 0);
    scene.physics.add.existing(this.barrier, true);
  }

  get collider(): Phaser.GameObjects.Rectangle {
    return this.barrier;
  }

  get isExtended(): boolean {
    return this.extended;
  }

  update(): void {
    const powered = this.input.isPowered();
    if (powered === this.extended) return;
    this.extended = powered;

    const scene = this.barrier.scene;
    this.planks.forEach((plank, i) => {
      scene.tweens.add({
        targets: plank,
        y: powered ? this.y : this.y + 90,
        alpha: powered ? 1 : 0,
        duration: 300,
        delay: i * 45,
        ease: "Back.out",
      });
    });

    (this.barrier.body as Phaser.Physics.Arcade.StaticBody).enable = !powered;
  }
}
