/**
 * Spring.ts — Phase 1, Action.JUMP (A / green).
 *
 * Drills: press A. The canonical first lesson — a green prompt over a spring,
 * press the green button, Spark boings. A transfers to "jump" in real games.
 */

import Phaser from "phaser";
import { Action } from "@/input/Action";
import { COLOR, XBOX_BUTTON } from "@/config/Palette";
import { PressProp } from "./PressProp";
import { InteractContext, InteractableConfig } from "@/systems/Interactable";

export class Spring extends PressProp {
  private coil: Phaser.GameObjects.Graphics;
  private compression = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super({ scene, action: Action.JUMP, x, y } satisfies InteractableConfig);
    scene.add.ellipse(x, y + 6, 88, 24, COLOR.metalDark).setDepth(9); // base plate
    this.coil = scene.add.graphics().setDepth(10);
    this.redraw();
  }

  private redraw(): void {
    const g = this.coil;
    g.clear();
    g.lineStyle(7, XBOX_BUTTON.A, 1); // green: matches the A prompt
    const turns = 5;
    const top = this.y - 70 + this.compression * 46;
    const bottom = this.y;
    const segH = (bottom - top) / turns;
    g.beginPath();
    g.moveTo(this.x - 30, bottom);
    for (let i = 0; i < turns; i++) {
      const yy = bottom - i * segH;
      g.lineTo(this.x + (i % 2 === 0 ? 30 : -30), yy - segH / 2);
      g.lineTo(this.x + (i % 2 === 0 ? -30 : 30), yy - segH);
    }
    g.strokePath();
    // Cap.
    g.fillStyle(XBOX_BUTTON.A, 1);
    g.fillRoundedRect(this.x - 34, top - 12, 68, 16, 6);
  }

  protected respond(ctx: InteractContext, ghost: boolean): void {
    // Compress then release the coil.
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 110,
      yoyo: true,
      ease: "Quad.out",
      onUpdate: (tw) => {
        this.compression = tw.getValue() ?? 0;
        this.redraw();
      },
      onComplete: () => {
        this.compression = 0;
        this.redraw();
      },
    });
    // The button cue + rumble are played by the base on activation; here we only
    // add the world reaction so the two channels stay in sync, never doubled.
    if (!ghost && ctx.spark) ctx.spark.hop(110);
  }
}
