/**
 * PushableBattery.ts — a physics box Spark shoves onto the plate.
 *
 * The physics object is a plain Rectangle (not a Container): arcade bodies on
 * Rectangles auto-center and separate cleanly, whereas container bodies are
 * finicky about both — which quietly broke pushing the first time around. The
 * battery's "+" decorations are separate objects synced to the body each frame.
 *
 * Heavy drag so it slides and settles; collides with the world so it can never
 * be shoved out of reach. Never gets stuck — if it drifts, Spark pushes again.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";

export class PushableBattery {
  /** The physics-enabled object; pass this to scene.physics.add.collider. */
  readonly body: Phaser.GameObjects.Rectangle;
  private deco: Phaser.GameObjects.Container;
  readonly radius = 27;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.body = scene.add
      .rectangle(x, y, 54, 54, COLOR.gear)
      .setStrokeStyle(3, COLOR.gearDark)
      .setDepth(12);

    scene.physics.add.existing(this.body);
    const b = this.body.body as Phaser.Physics.Arcade.Body;
    b.setDamping(true);
    b.setDrag(0.0006, 0.0006);
    b.setMaxVelocity(360, 360);
    b.setBounce(0.1);
    b.setCollideWorldBounds(true);

    const nub = scene.add.rectangle(0, -32, 16, 10, COLOR.metalDark);
    const plus1 = scene.add.rectangle(0, 0, 20, 5, COLOR.gearDark);
    const plus2 = scene.add.rectangle(0, 0, 5, 20, COLOR.gearDark);
    this.deco = scene.add.container(x, y, [nub, plus1, plus2]).setDepth(13);
  }

  get x(): number {
    return this.body.x;
  }
  get y(): number {
    return this.body.y;
  }

  /** Keep the decorations glued to the physics body. */
  update(): void {
    this.deco.setPosition(this.body.x, this.body.y);
  }
}
