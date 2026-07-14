/**
 * PlateRoom.ts — Room 1: push the battery onto the plate to open the door.
 *
 * Skill exercised: locomotion + pushing (arcade physics). Graph:
 *   PressurePlate(source) → Door(sink), joined by a Wire.
 * Solved once the door has opened. Walk the battery off and it closes again;
 * "solved" latches so progress is never lost.
 */

import Phaser from "phaser";
import { PushableBattery } from "@/entities/automation/PushableBattery";
import { PressurePlate } from "@/entities/automation/PressurePlate";
import { Door } from "@/entities/automation/Door";
import { Wire } from "@/entities/automation/Wire";
import { GhostHint } from "@/ui/GhostHint";
import { COLOR } from "@/config/Palette";
import type { PuzzleRoom, RoomConfig, RoomContext } from "./PuzzleRoom";

export class PlateRoom implements PuzzleRoom {
  readonly hints: GhostHint[] = [];
  private battery: PushableBattery;
  private plate: PressurePlate;
  private door: Door;
  private wire: Wire;
  private _solved = false;
  private glow: Phaser.GameObjects.Arc;
  private glowTween?: Phaser.Tweens.Tween;

  constructor(cfg: RoomConfig, x: number, y: number) {
    const s = cfg.scene;
    this.battery = new PushableBattery(s, x, y);
    this.plate = new PressurePlate(s, x + 220, y);
    this.door = new Door(s, x + 430, y, this.plate.source, 130);
    this.wire = new Wire(
      s,
      [
        [x + 220, y + 22],
        [x + 220, y + 78],
        [x + 430, y + 78],
        [x + 430, y + 66],
      ],
      this.plate.source
    );

    // Attention glow on the battery, driven by a GhostHint while idle.
    this.glow = s.add.circle(x, y, 40, COLOR.gear, 0).setStrokeStyle(4, COLOR.sparkGlow, 0).setDepth(11);
    this.hints.push(
      new GhostHint({
        onPulse: () => this.startGlow(),
        onStopPulse: () => this.stopGlow(),
        onGhost: () => this.startGlow(),
        isDone: () => this._solved,
      })
    );

    // Physics wiring: Spark pushes the battery; the door blocks until open.
    s.physics.add.collider(cfg.spark.container, this.battery.body);
    s.physics.add.collider(cfg.spark.container, this.door.collider);
  }

  private startGlow(): void {
    if (this.glowTween) return;
    this.glow.setPosition(this.battery.x, this.battery.y);
    this.glowTween = this.glow.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.5, to: 0 },
      scale: { from: 0.8, to: 1.4 },
      duration: 800,
      repeat: -1,
    });
  }

  private stopGlow(): void {
    this.glowTween?.stop();
    this.glowTween = undefined;
    this.glow.setAlpha(0);
  }

  update(ctx: RoomContext): void {
    this.battery.update();
    this.glow.setPosition(this.battery.x, this.battery.y);
    this.plate.check(this.battery.x, this.battery.y, this.battery.radius);
    this.door.update();
    this.wire.update(ctx.time);

    if (this.door.isOpen && !this._solved) {
      this._solved = true;
      this.stopGlow();
      ctx.services.audio.play("powerOn");
      ctx.services.rumble.tap(0.5, 120);
    }
  }

  get solved(): boolean {
    return this._solved;
  }
}
