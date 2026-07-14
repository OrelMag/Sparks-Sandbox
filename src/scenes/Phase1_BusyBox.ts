/**
 * Phase1_BusyBox.ts — skills 0 & 1.
 *
 * The digital activity board. Spark stands still (StationaryController) and the
 * whole lesson is button → effect: press the green A and the green spring boings,
 * press blue X and the blue fan spins. The d-pad toy adds discrete direction.
 * Every prompt's color is the button's color; nothing here can be failed.
 *
 * This scene is deliberately thin — all the teaching lives in the props and the
 * shared PhaseScene machinery (hints, audio, rumble, soft-clamp).
 */

import { PhaseScene } from "@/core/PhaseScene";
import { Spark } from "@/entities/Spark";
import { StationaryController } from "@/entities/controllers/StationaryController";
import { Spring } from "@/entities/props/Spring";
import { Bell } from "@/entities/props/Bell";
import { Fan } from "@/entities/props/Fan";
import { Lights } from "@/entities/props/Lights";
import { DPadToy } from "@/entities/props/DPadToy";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/GameConfig";

export class Phase1_BusyBox extends PhaseScene {
  constructor() {
    super("P1_BusyBox");
  }

  private celebrated = false;

  protected buildPhase(): void {
    this.celebrated = false;
    const cx = GAME_WIDTH / 2;

    // A friendly floor line.
    this.add
      .rectangle(cx, GAME_HEIGHT - 120, GAME_WIDTH, 8, 0x3b3f6b)
      .setDepth(1);

    // Spark, stationary, front and center.
    this.spark = new Spark(this, cx, GAME_HEIGHT - 260);
    this.spark.setController(new StationaryController());
    this.placeLevelExit(cx, GAME_HEIGHT - 320);

    // Four face-button toys along the bottom + a d-pad selector above.
    this.addInteractable(new Spring(this, 210, GAME_HEIGHT - 150));
    this.addInteractable(new Fan(this, 450, GAME_HEIGHT - 170));
    this.addInteractable(new Lights(this, GAME_WIDTH - 450, GAME_HEIGHT - 175));
    this.addInteractable(new Bell(this, GAME_WIDTH - 210, GAME_HEIGHT - 175));
    this.addInteractable(new DPadToy(this, cx, 200));
  }

  protected onUpdate(): void {
    // Wordless "you found everything" moment — a burst of sparkle, no gate.
    if (!this.celebrated && this.props.allDiscovered) {
      this.celebrated = true;
      this.services.save.openPhase(this.scene.key);
      this.celebrate();
    }
  }

  private celebrate(): void {
    if (!this.spark) return;
    this.services.audio.play("powerOn");
    // A ring of little sparks bursting from Spark.
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const p = this.add.circle(this.spark.x, this.spark.y, 6, 0xfff2b8).setDepth(30);
      this.tweens.add({
        targets: p,
        x: this.spark.x + Math.cos(ang) * 160,
        y: this.spark.y + Math.sin(ang) * 160,
        alpha: 0,
        scale: 0.2,
        duration: 700,
        ease: "Quad.out",
        onComplete: () => p.destroy(),
      });
    }
    this.spark.hop(70);
    this.unlockNextExit("P2_GearPen", "gear");
  }
}
