/**
 * ConveyorBelt.ts — a Sink driven by a toggle Latch.
 *
 * Room 2's payoff: brace with LT and press A (the chord being drilled) to flip
 * the belt on. While on, the chevrons crawl and a block rides the belt to the
 * socket at the far end. Deliver the block → room solved. Toggling off stops it
 * mid-travel — cause and effect he can see.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import type { Latch } from "@/systems/logic/SignalGraph";

export class ConveyorBelt {
  private chevrons: Phaser.GameObjects.Triangle[] = [];
  private block: Phaser.GameObjects.Container;
  private scroll = 0;
  private blockT = 0; // 0..1 along the belt
  private delivered = false;

  constructor(
    private scene: Phaser.Scene,
    private x1: number,
    private x2: number,
    private y: number,
    private latch: Latch
  ) {
    const w = x2 - x1;
    scene.add.rectangle((x1 + x2) / 2, y, w, 44, COLOR.metalDark).setDepth(6).setStrokeStyle(3, 0x2a2f4a);

    // Direction chevrons along the belt.
    const n = Math.floor(w / 46);
    for (let i = 0; i < n; i++) {
      const cx = x1 + 26 + i * 46;
      const tri = scene.add
        .triangle(cx, y, 0, -8, 12, 0, 0, 8, COLOR.wireOff)
        .setDepth(7);
      this.chevrons.push(tri);
    }

    // Socket at the far end (the target).
    scene.add.rectangle(x2 + 26, y, 20, 50, COLOR.metal).setStrokeStyle(3, COLOR.metalDark).setDepth(6);

    // The block that rides the belt.
    const box = scene.add.rectangle(0, 0, 40, 40, COLOR.gear).setStrokeStyle(3, COLOR.gearDark);
    this.block = scene.add.container(x1, y - 4, [box]).setDepth(12);
  }

  get isDelivered(): boolean {
    return this.delivered;
  }

  update(dt: number): void {
    const on = this.latch.isPowered();

    // Chevrons: bright and crawling when on.
    if (on) this.scroll += dt * 60;
    this.chevrons.forEach((c, i) => {
      const lit = on && Math.floor(this.scroll / 8 + i) % 2 === 0;
      c.setFillStyle(lit ? COLOR.wireOn : COLOR.wireOff);
    });

    if (on && !this.delivered) {
      this.blockT = Math.min(1, this.blockT + dt * 0.28);
      this.block.x = Phaser.Math.Linear(this.x1, this.x2 + 26, this.blockT);
      if (this.blockT >= 1) this.deliver();
    }
  }

  private deliver(): void {
    this.delivered = true;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const p = this.scene.add.circle(this.block.x, this.y, 5, COLOR.wireOn).setDepth(30);
      this.scene.tweens.add({
        targets: p,
        x: this.block.x + Math.cos(ang) * 44,
        y: this.y + Math.sin(ang) * 44,
        alpha: 0,
        duration: 450,
        onComplete: () => p.destroy(),
      });
    }
  }
}
