/**
 * Phase4_AutomationGates.ts — skills 7 & 8.
 *
 * Three automation rooms in one arena, each drilling a controller chord (the
 * circuitry is the wrapper; the finger pattern is the lesson):
 *   Room 1 — push a battery onto a plate to open a door (locomotion + push).
 *   Room 2 — brace LT + press A to run a conveyor (skill 7 hold-and-press).
 *   Room 3 — hold LB + RB together to extend a bridge (skill 8 simultaneous).
 *
 * The SkillTier (chosen at the hub) decides whether the logic is drawn exposed.
 * Nothing locks out: every room resets when you walk away.
 */

import { PhaseScene } from "@/core/PhaseScene";
import { Spark } from "@/entities/Spark";
import { PuzzleController } from "@/entities/controllers/PuzzleController";
import { PlateRoom } from "@/levels/phase4/PlateRoom";
import { ConveyorRoom } from "@/levels/phase4/ConveyorRoom";
import { BridgeRoom } from "@/levels/phase4/BridgeRoom";
import type { PuzzleRoom, RoomConfig } from "@/levels/phase4/PuzzleRoom";
import { ProgressPips } from "@/ui/ProgressPips";
import { COLOR } from "@/config/Palette";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/GameConfig";

export class Phase4_AutomationGates extends PhaseScene {
  constructor() {
    super("P4_AutomationGates");
  }

  private rooms: PuzzleRoom[] = [];
  private pips!: ProgressPips;
  private solvedCount = 0;
  private celebrated = false;

  protected buildPhase(): void {
    this.rooms = [];
    this.solvedCount = 0;
    this.celebrated = false;

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40, COLOR.floor, 0.18)
      .setStrokeStyle(4, COLOR.metalDark)
      .setDepth(-1);

    // Spark starts bottom-left with the puzzle controller (roam + brace + push).
    this.spark = new Spark(this, 120, GAME_HEIGHT - 90);
    this.spark.setController(new PuzzleController());
    this.placeLevelExit(GAME_WIDTH - 90, GAME_HEIGHT - 110);

    const tier = this.services.save.tier;
    const cfg: RoomConfig = { scene: this, spark: this.spark, tier };

    this.rooms.push(new PlateRoom(cfg, 150, 150));
    this.rooms.push(new ConveyorRoom(cfg, 300, 380));
    this.rooms.push(new BridgeRoom(cfg, 170, 560));

    for (const room of this.rooms) {
      for (const h of room.hints) this.registerHint(h);
    }

    this.pips = new ProgressPips(this, GAME_WIDTH - 140, 44, this.rooms.length, COLOR.wireOn);
  }

  protected onUpdate(dt: number): void {
    if (!this.spark) return;
    const ctx = {
      spark: this.spark,
      input: this.services.input,
      services: this.services,
      dt,
      time: this.time.now,
    };

    let solved = 0;
    for (const room of this.rooms) {
      room.update(ctx);
      if (room.solved) solved++;
    }

    // Fill a pip each time a new room is solved.
    while (this.solvedCount < solved) {
      this.pips.fillNext();
      this.solvedCount++;
    }

    if (!this.celebrated && solved >= this.rooms.length) {
      this.celebrated = true;
      this.services.save.openPhase(this.scene.key);
      this.celebrate();
    }
  }

  private celebrate(): void {
    if (!this.spark) return;
    this.services.audio.play("open");
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2;
      const p = this.add.circle(this.spark.x, this.spark.y, 6, COLOR.wireOn).setDepth(30);
      this.tweens.add({
        targets: p,
        x: this.spark.x + Math.cos(ang) * 190,
        y: this.spark.y + Math.sin(ang) * 190,
        alpha: 0,
        duration: 850,
        onComplete: () => p.destroy(),
      });
    }
    this.spark.pop(1);
    this.unlockNextExit("Hub", "home");
  }
}
