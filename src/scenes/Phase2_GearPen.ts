/**
 * Phase2_GearPen.ts — skills 2, 3, 4.
 *
 * Two lessons in one continuous space, because the seam is the point: the world
 * should feel like it GREW, not like a level changed.
 *
 *   Catch mode (skill 2): Spark is pinned to a bottom line in a narrow channel
 *   and slides left/right (AxisController) to catch falling gears. Generous
 *   magnet assist; missed gears pile on the floor and stay catchable.
 *
 *   Roam mode (skills 3 & 4): once enough gears are caught, the channel walls
 *   fall away, the world opens to full 2D (FreeRoamController), and Spark herds
 *   sheep into a corral. Clicking the stick (L3) sprints.
 *
 * No timers, no misses, no lose state — the world simply opens when he shows the
 * skill.
 */

import { PhaseScene } from "@/core/PhaseScene";
import { Spark } from "@/entities/Spark";
import { AxisController } from "@/entities/controllers/AxisController";
import { FreeRoamController } from "@/entities/controllers/FreeRoamController";
import { Gear } from "@/entities/Gear";
import { Sheep } from "@/entities/Sheep";
import { ProgressPips } from "@/ui/ProgressPips";
import { ControllerDiagram } from "@/ui/ControllerDiagram";
import { GhostHint } from "@/ui/GhostHint";
import { Action } from "@/input/Action";
import { COLOR } from "@/config/Palette";
import { TUNING } from "@/config/Tuning";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/GameConfig";
import Phaser from "phaser";

type Mode = "catch" | "roam";

const CHANNEL = { left: 360, right: GAME_WIDTH - 360 };

export class Phase2_GearPen extends PhaseScene {
  constructor() {
    super("P2_GearPen");
  }

  private mode: Mode = "catch";
  private lineY = GAME_HEIGHT - 140;

  private walls: Phaser.GameObjects.Rectangle[] = [];
  private gears: Gear[] = [];
  private pips!: ProgressPips;
  private caught = 0;
  private spawnTimer?: Phaser.Time.TimerEvent;

  private stickPrompt!: ControllerDiagram;
  private dashPrompt?: ControllerDiagram;

  private sheep: Sheep[] = [];
  private corral = new Phaser.Geom.Rectangle(GAME_WIDTH - 300, 90, 230, 200);
  private penned = false;
  private dashUsed = false;

  protected buildPhase(): void {
    this.mode = "catch";
    this.walls = [];
    this.gears = [];
    this.caught = 0;
    this.spawnTimer = undefined;
    this.dashPrompt = undefined;
    this.sheep = [];
    this.penned = false;
    this.dashUsed = false;

    // Start confined to the channel.
    this.worldBounds = new Phaser.Geom.Rectangle(
      CHANNEL.left,
      40,
      CHANNEL.right - CHANNEL.left,
      GAME_HEIGHT - 40
    );

    // Floor + channel walls (these will fall away on unlock).
    this.add.rectangle(GAME_WIDTH / 2, this.lineY + 30, GAME_WIDTH, 8, COLOR.floor).setDepth(1);
    this.walls.push(
      this.add.rectangle(CHANNEL.left - 10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, COLOR.metalDark).setDepth(2),
      this.add.rectangle(CHANNEL.right + 10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, COLOR.metalDark).setDepth(2)
    );

    // Spark on the catch line.
    this.spark = new Spark(this, GAME_WIDTH / 2, this.lineY);
    this.spark.setController(new AxisController(this.lineY));
    this.placeLevelExit(CHANNEL.left + 50, this.lineY);

    // Progress: one pip per gear needed.
    this.pips = new ProgressPips(this, GAME_WIDTH / 2, 60, TUNING.gears.unlockCount);

    // Wordless stick prompt + hint. Learned once he catches his first gear.
    this.stickPrompt = new ControllerDiagram(this, "LSTICK");
    this.stickPrompt.setPosition(GAME_WIDTH / 2, 150);
    this.registerHint(
      new GhostHint({
        onPulse: () => this.stickPrompt.pulse(),
        onStopPulse: () => this.stickPrompt.stopPulse(),
        onGhost: () => this.demoStickSlide(),
        isDone: () => this.caught > 0,
      })
    );

    // Begin dropping gears.
    this.spawnTimer = this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: () => this.spawnGear(),
    });
    this.spawnGear();
  }

  private spawnGear(): void {
    if (this.mode !== "catch") return;
    if (this.gears.length > 6) return;
    const x = Phaser.Math.Between(CHANNEL.left + 40, CHANNEL.right - 40);
    this.gears.push(new Gear(this, x, this.lineY, Phaser.Math.Between(130, 180)));
  }

  private demoStickSlide(): void {
    if (!this.spark) return;
    const g = this.spawnGhostSpark(this.spark.x, this.spark.y);
    this.tweens.add({
      targets: g.container,
      x: this.spark.x - 90,
      duration: 400,
      yoyo: true,
      repeat: 1,
      ease: "Sine.inOut",
      onComplete: () => g.dispose(),
    });
  }

  protected onUpdate(dt: number): void {
    if (!this.spark) return;

    if (this.mode === "catch") {
      for (const gear of this.gears) {
        if (gear.update(dt, this.spark)) this.onCaught();
      }
      this.gears = this.gears.filter((g) => !g.isCollected);
      if (this.caught >= TUNING.gears.unlockCount) this.openWorld();
    } else {
      this.updateRoam(dt);
    }
  }

  private onCaught(): void {
    this.caught++;
    this.pips.fillNext();
    this.services.audio.play("catch");
    this.services.rumble.tap(0.5, 90);
    this.spark?.pop(0.5);
    this.stickPrompt.stopPulse();
  }

  private openWorld(): void {
    this.mode = "roam";
    this.spawnTimer?.remove();
    this.stickPrompt.setVisible(false);

    // Drop the walls away and open the bounds — the world grows.
    for (const w of this.walls) {
      this.tweens.add({
        targets: w,
        y: GAME_HEIGHT + 120,
        alpha: 0,
        duration: 700,
        ease: "Back.in",
        onComplete: () => w.destroy(),
      });
    }
    this.tweens.add({ targets: this.pips.container, alpha: 0, duration: 500 });
    this.worldBounds = new Phaser.Geom.Rectangle(40, 40, GAME_WIDTH - 80, GAME_HEIGHT - 80);

    this.services.audio.play("open");
    this.spark?.setController(new FreeRoamController());

    this.drawCorral();
    this.spawnSheep();

    // Introduce the dash (L3) once he's roaming, as a bonus chord.
    this.dashPrompt = new ControllerDiagram(this, "L3");
    this.dashPrompt.setPosition(120, GAME_HEIGHT - 90);
    this.registerHint(
      new GhostHint({
        onPulse: () => this.dashPrompt?.pulse(),
        onStopPulse: () => this.dashPrompt?.stopPulse(),
        onGhost: () => this.dashPrompt?.depress(),
        isDone: () => this.dashUsed,
        pulseAfter: 4,
        ghostAfter: 9,
      })
    );
  }

  private drawCorral(): void {
    const c = this.corral;
    const g = this.add.graphics().setDepth(3);
    g.lineStyle(6, COLOR.gearDark, 1);
    // A gap on the left side as the entrance.
    g.strokeRect(c.x, c.y, c.width, c.height);
    g.fillStyle(COLOR.mudClean, 0.15);
    g.fillRect(c.x, c.y, c.width, c.height);
  }

  private spawnSheep(): void {
    for (let i = 0; i < TUNING.sheep.count; i++) {
      const x = Phaser.Math.Between(150, GAME_WIDTH - 450);
      const y = Phaser.Math.Between(250, GAME_HEIGHT - 200);
      this.sheep.push(new Sheep(this, x, y, this.worldBounds));
    }
  }

  private updateRoam(dt: number): void {
    if (!this.spark) return;
    if (this.services.input.isDown(Action.DASH)) {
      if (!this.dashUsed) {
        this.dashUsed = true;
        this.dashPrompt?.stopPulse();
      }
    }
    for (const s of this.sheep) s.update(dt, this.spark, this.corral);

    if (!this.penned && this.sheep.every((s) => s.isPenned)) {
      this.penned = true;
      this.services.save.openPhase(this.scene.key);
      this.celebrate();
    }
  }

  private celebrate(): void {
    if (!this.spark) return;
    this.services.audio.play("powerOn");
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const p = this.add.circle(this.spark.x, this.spark.y, 6, COLOR.sparkGlow).setDepth(30);
      this.tweens.add({
        targets: p,
        x: this.spark.x + Math.cos(ang) * 170,
        y: this.spark.y + Math.sin(ang) * 170,
        alpha: 0,
        duration: 750,
        onComplete: () => p.destroy(),
      });
    }
    this.spark.pop(1);
    this.unlockNextExit("P3_DualStick", "dualstick");
  }
}
