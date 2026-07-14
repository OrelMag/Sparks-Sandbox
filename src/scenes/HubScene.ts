/**
 * HubScene.ts — the wordless playground and phase select.
 *
 * No menu, no list: the hub is a room, and you drive Spark into a door to enter
 * a phase. Difficulty is two pedestals — one gear (SIMPLE) or three meshed gears
 * (LOGIC) — and Spark chooses by standing on one. He picks by walking; nothing
 * judges him, nothing is spelled out.
 */

import Phaser from "phaser";
import { PhaseScene } from "@/core/PhaseScene";
import { Spark } from "@/entities/Spark";
import { FreeRoamController } from "@/entities/controllers/FreeRoamController";
import { Portal } from "@/entities/Portal";
import { drawGear } from "@/entities/Gear";
import { SkillTier } from "@/core/SkillTier";
import { COLOR } from "@/config/Palette";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/GameConfig";

interface Pedestal {
  tier: SkillTier;
  x: number;
  y: number;
  ring: Phaser.GameObjects.Arc;
}

export class HubScene extends PhaseScene {
  constructor() {
    super("Hub");
  }

  private portals: Portal[] = [];
  private pedestals: Pedestal[] = [];
  private transitioning = false;

  protected buildPhase(): void {
    // Soft playground floor.
    this.add
      .ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH * 0.9, 260, COLOR.floor, 0.3)
      .setDepth(-1);

    this.spark = new Spark(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    this.spark.setController(new FreeRoamController());

    // Four phase portals across the top, in curriculum order.
    const y = 170;
    this.portals.push(
      new Portal(this, 260, y, "buttons", "P1_BusyBox"),
      new Portal(this, 520, y, "gear", "P2_GearPen"),
      new Portal(this, 780, y, "dualstick", "P3_DualStick"),
      new Portal(this, 1040, y, "gears", "P4_AutomationGates")
    );

    // Two difficulty pedestals near the bottom.
    this.buildPedestal(SkillTier.SIMPLE, 470, GAME_HEIGHT - 90, 1);
    this.buildPedestal(SkillTier.LOGIC, 810, GAME_HEIGHT - 90, 3);
    this.refreshPedestals();
  }

  private buildPedestal(tier: SkillTier, x: number, y: number, gearCount: number): void {
    const ring = this.add.circle(x, y, 46, COLOR.metalDark, 0.5).setStrokeStyle(4, COLOR.metal).setDepth(2);
    // Gear emblem(s) hovering above the pad.
    const holder = this.add.container(x, y - 70).setDepth(6);
    for (let i = 0; i < gearCount; i++) {
      const g = this.add.graphics();
      drawGear(g, 16, i % 2 === 0 ? COLOR.gear : COLOR.metal, COLOR.gearDark);
      g.setPosition((i - (gearCount - 1) / 2) * 22, (i % 2) * 8);
      holder.add(g);
    }
    this.pedestals.push({ tier, x, y, ring });
  }

  private refreshPedestals(): void {
    const current = this.services.save.tier;
    for (const p of this.pedestals) {
      const on = p.tier === current;
      p.ring.setStrokeStyle(4, on ? COLOR.wireOn : COLOR.metal);
      p.ring.setFillStyle(on ? COLOR.wireOn : COLOR.metalDark, on ? 0.25 : 0.5);
    }
  }

  protected onUpdate(): void {
    if (!this.spark || this.transitioning) return;

    // Stand on a pedestal → set difficulty.
    for (const p of this.pedestals) {
      if (Phaser.Math.Distance.Between(this.spark.x, this.spark.y, p.x, p.y) < 50) {
        if (this.services.save.tier !== p.tier) {
          this.services.save.setTier(p.tier);
          this.services.audio.play("dpad");
          this.refreshPedestals();
        }
      }
    }

    // Drive into a door → enter that phase.
    for (const portal of this.portals) {
      if (portal.check(this.spark.x, this.spark.y)) {
        this.enter(portal.sceneKey);
        break;
      }
    }
  }

  private enter(sceneKey: string): void {
    this.transitioning = true;
    this.services.audio.play("open");
    this.spark?.pop(0.8);
    this.cameras.main.fadeOut(350, 15, 16, 32);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey);
    });
  }
}
