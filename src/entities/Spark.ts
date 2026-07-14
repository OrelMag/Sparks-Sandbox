/**
 * Spark.ts — the clockwork robot.
 *
 * Owns the visuals and the "juice" (squash/stretch, hop, spin, eye blink) that
 * are constant everywhere. Movement is delegated to a swappable SparkController
 * (the controller-slot pattern). The body is built by a static factory so ghost
 * demos can spawn an identical faint copy.
 *
 * Uses an Arcade physics body on the container so later phases get collisions
 * (sheep, mud, walls) for free. Zero failure states: Spark can be nudged and
 * soft-clamped, never hurt, never removed.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import type { SparkController } from "./controllers/SparkController";
import type { InputState } from "@/input/InputState";

export interface SparkBodyParts {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  face: Phaser.GameObjects.Container;
}

export class Spark {
  readonly container: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Arc;
  private face: Phaser.GameObjects.Container;
  private controller: SparkController | null = null;

  /** Facing angle in radians; used by the turret in Phase 3. */
  facing = 0;

  readonly radius = 26;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number
  ) {
    const parts = Spark.buildBody(scene, 1, 1);
    this.container = parts.container;
    this.body = parts.body;
    this.face = parts.face;
    this.container.setPosition(x, y);
    this.container.setDepth(20);

    scene.physics.add.existing(this.container);
    const pb = this.container.body as Phaser.Physics.Arcade.Body;
    pb.setCircle(this.radius, -this.radius, -this.radius);
    pb.setDamping(true);
    pb.setDrag(0.0001, 0.0001);
    pb.setMaxVelocity(700, 700);

    this.startIdleAnim();
  }

  /** Build Spark's visual body. Shared by the real Spark and ghost demos. */
  static buildBody(
    scene: Phaser.Scene,
    scale: number,
    alpha: number
  ): SparkBodyParts {
    const r = 26 * scale;

    // Soft glow.
    const glow = scene.add.circle(0, 0, r * 1.35, COLOR.sparkGlow, 0.18 * alpha);

    // Feet.
    const footL = scene.add.ellipse(-r * 0.5, r * 0.95, r * 0.5, r * 0.32, COLOR.sparkBodyDark, alpha);
    const footR = scene.add.ellipse(r * 0.5, r * 0.95, r * 0.5, r * 0.32, COLOR.sparkBodyDark, alpha);

    // Body.
    const body = scene.add.circle(0, 0, r, COLOR.sparkBody, alpha);
    body.setStrokeStyle(3 * scale, COLOR.sparkBodyDark, alpha);

    // A little wind-up key on top.
    const keyStem = scene.add.rectangle(0, -r * 1.15, 3 * scale, r * 0.5, COLOR.metalDark, alpha);
    const keyRing = scene.add.circle(0, -r * 1.45, r * 0.22, 0x000000, 0).setStrokeStyle(3 * scale, COLOR.metalDark, alpha);

    // Face: two eyes + a cheek light.
    const eyeL = scene.add.circle(-r * 0.32, -r * 0.1, r * 0.16, COLOR.sparkEye, alpha);
    const eyeR = scene.add.circle(r * 0.32, -r * 0.1, r * 0.16, COLOR.sparkEye, alpha);
    const shineL = scene.add.circle(-r * 0.27, -r * 0.16, r * 0.05, 0xffffff, alpha);
    const shineR = scene.add.circle(r * 0.37, -r * 0.16, r * 0.05, 0xffffff, alpha);
    const cheek = scene.add.circle(0, r * 0.3, r * 0.12, COLOR.sparkGlow, 0.7 * alpha);
    const face = scene.add.container(0, 0, [eyeL, eyeR, shineL, shineR, cheek]);

    const container = scene.add.container(0, 0, [
      glow,
      footL,
      footR,
      keyStem,
      keyRing,
      body,
      face,
    ]);
    return { container, body, face };
  }

  setController(controller: SparkController): void {
    this.controller = controller;
  }

  update(input: InputState, dt: number): void {
    this.controller?.update(this, input, dt);
  }

  // --- helpers used by controllers ---

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setVelocity(vx: number, vy: number): void {
    (this.container.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.container.body as Phaser.Physics.Arcade.Body;
  }

  // --- juice ---

  private startIdleAnim(): void {
    // Gentle breathing bob.
    this.scene.tweens.add({
      targets: this.container,
      scaleY: 0.97,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    // Occasional blink.
    this.scene.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => this.blink(),
    });
  }

  blink(): void {
    this.scene.tweens.add({
      targets: this.face,
      scaleY: 0.1,
      duration: 80,
      yoyo: true,
      ease: "Quad.inOut",
    });
  }

  /** Squash-and-stretch pop, the universal "I did a thing" tell. */
  pop(strength = 1): void {
    const c = this.container;
    this.scene.tweens.killTweensOf(c);
    c.setScale(1);
    this.scene.tweens.add({
      targets: c,
      scaleX: 1 + 0.25 * strength,
      scaleY: 1 - 0.2 * strength,
      duration: 90,
      yoyo: true,
      ease: "Quad.out",
      onComplete: () => c.setScale(1),
    });
  }

  /** A hop in place (spring reaction). */
  hop(height = 90, onApex?: () => void): void {
    const c = this.container;
    const baseY = c.y;
    this.scene.tweens.add({
      targets: c,
      y: baseY - height,
      duration: 260,
      ease: "Quad.out",
      yoyo: true,
      onYoyo: onApex,
      onComplete: () => c.setY(baseY),
    });
    this.pop(0.6);
  }

  /** Wobble left-right (bell reaction / happy jiggle). */
  wobble(): void {
    const c = this.container;
    this.scene.tweens.add({
      targets: c,
      angle: { from: -8, to: 8 },
      duration: 90,
      yoyo: true,
      repeat: 3,
      ease: "Sine.inOut",
      onComplete: () => c.setAngle(0),
    });
  }

  /** Point Spark's facing toward a world angle (Phase 3 turret host). */
  faceAngle(rad: number): void {
    this.facing = rad;
  }

  destroy(): void {
    this.container.destroy();
  }
}
