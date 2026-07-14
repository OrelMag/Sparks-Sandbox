/**
 * Sheep.ts — a robotic sheep to herd in Phase 2b.
 *
 * Flees gently from Spark when he gets close, otherwise wanders. Drive it into
 * the corral and it settles, content. There is no way to hurt or lose a sheep —
 * a sheep that wanders off is just a sheep to herd again. Herding all of them
 * opens the way onward.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import type { Spark } from "./Spark";

export class Sheep {
  readonly container: Phaser.GameObjects.Container;
  private vx = 0;
  private vy: number;
  private penned = false;
  readonly radius = 24;
  private wander: number;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    private bounds: Phaser.Geom.Rectangle
  ) {
    this.vy = 0;
    this.wander = Phaser.Math.FloatBetween(0, Math.PI * 2);

    const body = scene.add.circle(0, 0, this.radius, COLOR.sheep);
    body.setStrokeStyle(3, 0xd9d9e8);
    const wool1 = scene.add.circle(-10, -8, 10, COLOR.sheep).setStrokeStyle(2, 0xd9d9e8);
    const wool2 = scene.add.circle(10, -8, 10, COLOR.sheep).setStrokeStyle(2, 0xd9d9e8);
    const head = scene.add.circle(0, this.radius * 0.5, 9, COLOR.sheepFace);
    const eye = scene.add.circle(0, this.radius * 0.45, 2.5, 0xffffff);
    this.container = scene.add.container(x, y, [wool1, wool2, body, head, eye]).setDepth(14);
  }

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
  }
  get isPenned(): boolean {
    return this.penned;
  }

  update(dt: number, spark: Spark, corral: Phaser.Geom.Rectangle): void {
    if (this.penned) return;

    const dx = this.x - spark.x;
    const dy = this.y - spark.y;
    const dist = Math.hypot(dx, dy) || 1;
    const fleeRadius = 150;

    if (dist < fleeRadius) {
      // Flee directly away from Spark, faster the closer he is.
      const urgency = (1 - dist / fleeRadius) * 260;
      this.vx += (dx / dist) * urgency * dt;
      this.vy += (dy / dist) * urgency * dt;
    } else {
      // Gentle wander.
      this.wander += Phaser.Math.FloatBetween(-1, 1) * dt;
      this.vx += Math.cos(this.wander) * 20 * dt;
      this.vy += Math.sin(this.wander) * 20 * dt;
    }

    this.vx *= 0.9;
    this.vy *= 0.9;
    this.container.x += this.vx * dt;
    this.container.y += this.vy * dt;

    // Keep inside the play field (soft — sheep never leave the world).
    const b = this.bounds;
    this.container.x = Phaser.Math.Clamp(this.container.x, b.x, b.right);
    this.container.y = Phaser.Math.Clamp(this.container.y, b.y, b.bottom);

    // A little waddle.
    this.container.setAngle(Math.sin(this.wander * 3) * 6);

    if (corral.contains(this.x, this.y)) this.settle();
  }

  private settle(): void {
    this.penned = true;
    this.vx = 0;
    this.vy = 0;
    this.scene.tweens.add({
      targets: this.container,
      angle: 0,
      scale: { from: 1.15, to: 1 },
      duration: 300,
      ease: "Back.out",
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
