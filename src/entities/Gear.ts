/**
 * Gear.ts — a falling collectible for Phase 2a.
 *
 * Falls from the top; when Spark is near, a magnet gently pulls it toward him so
 * catching feels generous, never twitchy. Crucially, a gear that reaches the
 * floor does NOT disappear — it settles and keeps drifting toward Spark, so a
 * "miss" just becomes a slightly slower catch. Missing is never losing.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import { TUNING } from "@/config/Tuning";
import type { Spark } from "./Spark";

export class Gear {
  readonly container: Phaser.GameObjects.Container;
  private vx = 0;
  private vy: number;
  private spin = 0;
  private spinRate: number;
  private settled = false;
  private collected = false;
  readonly radius = 22;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    private floorY: number,
    fallSpeed = 150
  ) {
    this.vy = fallSpeed;
    this.spinRate = Phaser.Math.Between(-3, 3) || 2;

    const g = scene.add.graphics();
    drawGear(g, this.radius, COLOR.gear, COLOR.gearDark);
    const shine = scene.add.circle(0, 0, this.radius * 0.35, COLOR.sparkGlow, 0.5);
    this.container = scene.add.container(x, -40, [g, shine]).setDepth(15);
  }

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
  }
  get isCollected(): boolean {
    return this.collected;
  }

  /** Returns true on the frame it is collected. */
  update(dt: number, spark: Spark): boolean {
    if (this.collected) return false;

    // Magnet assist near Spark.
    const dx = spark.x - this.x;
    const dy = spark.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < TUNING.gears.magnetRadius) {
      const pull = TUNING.gears.magnetStrength;
      this.vx += (dx / dist) * pull * dt;
      this.vy += (dy / dist) * pull * dt;
    } else if (!this.settled) {
      this.vy += 400 * dt; // gravity while falling
    }

    // Settle on the floor instead of vanishing.
    if (this.y >= this.floorY && !this.settled && dist >= TUNING.gears.magnetRadius) {
      this.settled = true;
      this.vy = 0;
      this.vx *= 0.3;
    }

    // Damp horizontal drift.
    this.vx *= 0.92;

    this.container.x += this.vx * dt;
    this.container.y += this.vy * dt;
    if (this.settled) this.container.y = Math.min(this.container.y, this.floorY);

    this.spin += this.spinRate * dt * 60;
    (this.container.getAt(0) as Phaser.GameObjects.Graphics).setRotation(
      Phaser.Math.DegToRad(this.spin)
    );

    // Collection.
    if (dist < spark.radius + this.radius) {
      this.collect();
      return true;
    }
    return false;
  }

  private collect(): void {
    this.collected = true;
    // A little sparkle burst, then remove.
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 4, COLOR.sparkGlow).setDepth(30);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(ang) * 40,
        y: this.y + Math.sin(ang) * 40,
        alpha: 0,
        duration: 350,
        onComplete: () => p.destroy(),
      });
    }
    this.container.destroy();
  }

  destroy(): void {
    if (!this.collected) this.container.destroy();
  }
}

/** Draw a gear: a toothed ring with a hub. Reused by any gear visual. */
export function drawGear(
  g: Phaser.GameObjects.Graphics,
  radius: number,
  fill: number,
  stroke: number,
  teeth = 8
): void {
  g.clear();
  g.fillStyle(fill, 1);
  g.lineStyle(3, stroke, 1);
  const inner = radius * 0.72;
  const outer = radius;
  g.beginPath();
  const steps = teeth * 2;
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    const r = i % 2 === 0 ? outer : inner;
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Hub.
  g.fillStyle(stroke, 1);
  g.fillCircle(0, 0, radius * 0.28);
}
