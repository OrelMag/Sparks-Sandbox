/**
 * WaterCannon.ts — Phase 3, the aim + fire half (skills 5 & 6).
 *
 * A turret that rides on Spark. The RIGHT stick rotates it (skill 5: aim,
 * independent of where the LEFT stick is driving). Pulling RT sprays water
 * droplets along the aim (skill 6: the trigger completes the modern move-aim-fire
 * grammar). RT — not a face button — because that is the universal "primary
 * action" convention we're teaching (see CLAUDE.md transfer rule).
 *
 * Droplets are cheap particles the scene tests against mud. There is no ammo and
 * nothing to miss; spraying always visibly does something.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import { TUNING } from "@/config/Tuning";
import type { Spark } from "./Spark";

export interface Droplet {
  obj: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
}

export class WaterCannon {
  private barrel: Phaser.GameObjects.Container;
  private angle = 0; // radians, current turret facing
  private droplets: Droplet[] = [];
  private cooldown = 0;

  constructor(private scene: Phaser.Scene) {
    const base = scene.add.circle(0, 0, 16, COLOR.metalDark);
    const barrel = scene.add.rectangle(22, 0, 40, 14, COLOR.metal).setOrigin(0.2, 0.5);
    const tip = scene.add.circle(44, 0, 8, COLOR.waterDark);
    this.barrel = scene.add.container(0, 0, [base, barrel, tip]).setDepth(22);
  }

  get aimAngle(): number {
    return this.angle;
  }

  /**
   * Update turret + spray.
   * @param aim right-stick vector (may be zero)
   * @param firing whether RT is held
   * @returns droplets active this frame, for the scene to test against mud
   */
  update(spark: Spark, aim: { x: number; y: number }, firing: boolean, dt: number): Droplet[] {
    // Follow Spark.
    this.barrel.setPosition(spark.x, spark.y);

    // Aim: rotate toward the right-stick angle if it's deflected; otherwise hold.
    const mag = Math.hypot(aim.x, aim.y);
    if (mag > 0.2) {
      const target = Math.atan2(aim.y, aim.x);
      this.angle = Phaser.Math.Angle.RotateTo(this.angle, target, TUNING.aim.turnLerp);
    }
    this.barrel.setRotation(this.angle);

    // Fire.
    this.cooldown -= dt;
    if (firing && this.cooldown <= 0) {
      this.cooldown = 0.04;
      this.emit(spark);
    }

    // Advance droplets.
    for (const d of this.droplets) {
      d.obj.x += d.vx * dt;
      d.obj.y += d.vy * dt;
      d.life -= dt;
      d.obj.setScale(Math.max(0.3, d.life * 2));
    }
    this.droplets = this.droplets.filter((d) => {
      if (d.life > 0) return true;
      d.obj.destroy();
      return false;
    });

    return this.droplets;
  }

  private emit(spark: Spark): void {
    const tipX = spark.x + Math.cos(this.angle) * 46;
    const tipY = spark.y + Math.sin(this.angle) * 46;
    const spread = Phaser.Math.FloatBetween(-0.14, 0.14);
    const a = this.angle + spread;
    const speed = Phaser.Math.FloatBetween(360, 460);
    const obj = this.scene.add.circle(tipX, tipY, 6, COLOR.water, 0.9).setDepth(21);
    this.droplets.push({
      obj,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: TUNING.aim.sprayRange / speed,
    });
  }

  /** Remove a droplet on impact (called by the scene when it hits mud). */
  consume(d: Droplet): void {
    d.life = 0;
    d.obj.destroy();
    this.droplets = this.droplets.filter((x) => x !== d);
  }

  destroy(): void {
    for (const d of this.droplets) d.obj.destroy();
    this.barrel.destroy();
  }
}
