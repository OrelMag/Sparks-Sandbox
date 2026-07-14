/**
 * Door.ts — a Sink that slides open while its input node is powered.
 *
 * Two halves part to reveal the way through. A static physics body blocks Spark
 * while closed and is disabled while open, so the puzzle gates passage without
 * ever trapping him (walk away and it simply closes again — no lock-out).
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import type { SignalNode } from "@/systems/logic/SignalGraph";

export class Door {
  private left: Phaser.GameObjects.Rectangle;
  private right: Phaser.GameObjects.Rectangle;
  private barrier: Phaser.GameObjects.Rectangle;
  private open = false;
  private readonly cx: number;
  private readonly halfW: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private input: SignalNode,
    height = 150
  ) {
    this.cx = x;
    this.halfW = 26;
    this.left = scene.add.rectangle(x - this.halfW / 2, y, this.halfW, height, COLOR.metal).setStrokeStyle(3, COLOR.metalDark).setDepth(8);
    this.right = scene.add.rectangle(x + this.halfW / 2, y, this.halfW, height, COLOR.metal).setStrokeStyle(3, COLOR.metalDark).setDepth(8);

    // Invisible collider that blocks passage while closed.
    this.barrier = scene.add.rectangle(x, y, this.halfW * 2, height, 0x000000, 0);
    scene.physics.add.existing(this.barrier, true);
  }

  get collider(): Phaser.GameObjects.Rectangle {
    return this.barrier;
  }

  update(): void {
    const powered = this.input.isPowered();
    if (powered === this.open) return;
    this.open = powered;

    const scene = this.left.scene;
    const shift = powered ? this.halfW + 4 : this.halfW / 2;
    scene.tweens.add({ targets: this.left, x: this.cx - shift, duration: 350, ease: "Quad.inOut" });
    scene.tweens.add({ targets: this.right, x: this.cx + shift, duration: 350, ease: "Quad.inOut" });

    const body = this.barrier.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = !powered;
    this.left.setFillStyle(powered ? COLOR.mudClean : COLOR.metal);
    this.right.setFillStyle(powered ? COLOR.mudClean : COLOR.metal);
  }

  get isOpen(): boolean {
    return this.open;
  }
}
