/**
 * Phase3_DualStick.ts — skills 5 & 6, the hardest wall in controller literacy.
 *
 * Spark is a little fire truck. LEFT stick drives (TankController), RIGHT stick
 * aims the water cannon (WaterCannon), RT sprays. He must drive with one thumb
 * while aiming with the other — the exact move+aim+fire grammar of every modern
 * console game.
 *
 * The camera is FIXED (top-down, never rotates or follows on the right stick):
 * right-stick-as-camera is what makes kids look at the ceiling and quit, so here
 * the right stick only ever aims. Mud washes progressively; nothing can fail.
 */

import Phaser from "phaser";
import { PhaseScene } from "@/core/PhaseScene";
import { Spark } from "@/entities/Spark";
import { TankController } from "@/entities/controllers/TankController";
import { WaterCannon } from "@/entities/WaterCannon";
import { MudBlob } from "@/entities/MudBlob";
import { ProgressPips } from "@/ui/ProgressPips";
import { ControllerDiagram } from "@/ui/ControllerDiagram";
import { GhostHint } from "@/ui/GhostHint";
import { Action } from "@/input/Action";
import { COLOR } from "@/config/Palette";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/GameConfig";

export class Phase3_DualStick extends PhaseScene {
  constructor() {
    super("P3_DualStick");
  }

  private cannon!: WaterCannon;
  private blobs: MudBlob[] = [];
  private pips!: ProgressPips;
  private cleaned = 0;

  private aimPrompt!: ControllerDiagram;
  private firePrompt!: ControllerDiagram;
  private aimUsed = false;
  private fireUsed = false;
  private celebrated = false;

  protected buildPhase(): void {
    // A framed arena floor to make "fixed camera, this is the whole world" read.
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 60, GAME_HEIGHT - 60, COLOR.floor, 0.25)
      .setStrokeStyle(4, COLOR.metalDark)
      .setDepth(0);

    this.spark = new Spark(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.spark.setController(new TankController());
    this.cannon = new WaterCannon(this);

    // Muddy objects to wash, scattered around the arena.
    const spots = [
      [220, 180],
      [1050, 180],
      [180, 560],
      [1080, 560],
      [640, 150],
    ] as const;
    for (const [x, y] of spots) this.blobs.push(new MudBlob(this, x, y));

    this.pips = new ProgressPips(this, GAME_WIDTH / 2, 40, this.blobs.length, COLOR.water);

    // Aim prompt (skill 5) — learned once he deflects the right stick.
    this.aimPrompt = new ControllerDiagram(this, "RSTICK");
    this.aimPrompt.setPosition(110, 90);
    this.registerHint(
      new GhostHint({
        onPulse: () => this.aimPrompt.pulse(),
        onStopPulse: () => this.aimPrompt.stopPulse(),
        onGhost: () => this.aimPrompt.depress(),
        isDone: () => this.aimUsed,
      })
    );

    // Fire prompt (skill 6) — learned once he pulls RT.
    this.firePrompt = new ControllerDiagram(this, "RT");
    this.firePrompt.setPosition(GAME_WIDTH - 110, 90);
    this.registerHint(
      new GhostHint({
        onPulse: () => this.firePrompt.pulse(),
        onStopPulse: () => this.firePrompt.stopPulse(),
        onGhost: () => this.firePrompt.depress(),
        isDone: () => this.fireUsed,
      })
    );
  }

  protected onUpdate(dt: number): void {
    if (!this.spark) return;
    const input = this.services.input;
    const aim = input.aim;
    const firing = input.isDown(Action.FIRE);

    if (Math.hypot(aim.x, aim.y) > 0.3) this.aimUsed = true;
    if (firing) {
      if (!this.fireUsed) this.fireUsed = true;
      this.firePrompt.stopPulse();
    }

    const droplets = this.cannon.update(this.spark, aim, firing, dt);

    // Test each droplet against each dirty blob.
    for (const d of droplets) {
      for (const blob of this.blobs) {
        if (blob.isClean) continue;
        if (Phaser.Math.Distance.Between(d.obj.x, d.obj.y, blob.x, blob.y) < blob.radius) {
          const completed = blob.wash();
          this.cannon.consume(d);
          if (completed) this.onBlobCleaned();
          break;
        }
      }
    }

    if (!this.celebrated && this.cleaned >= this.blobs.length) {
      this.celebrated = true;
      this.services.save.openPhase(this.scene.key);
      this.celebrate();
    }
  }

  private onBlobCleaned(): void {
    this.cleaned++;
    this.pips.fillNext();
    this.services.audio.play("clean");
    this.services.rumble.tap(0.4, 80);
  }

  private celebrate(): void {
    if (!this.spark) return;
    this.services.audio.play("powerOn");
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2;
      const p = this.add.circle(this.spark.x, this.spark.y, 6, COLOR.water).setDepth(30);
      this.tweens.add({
        targets: p,
        x: this.spark.x + Math.cos(ang) * 180,
        y: this.spark.y + Math.sin(ang) * 180,
        alpha: 0,
        duration: 800,
        onComplete: () => p.destroy(),
      });
    }
    this.spark.pop(1);
    this.goToHub();
  }
}
