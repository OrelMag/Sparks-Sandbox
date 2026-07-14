/**
 * DPadToy.ts — Phase 1, the d-pad selector (skill 1: discrete direction).
 *
 * Four lamps arranged in a cross that mirrors the physical d-pad. Pressing a
 * direction lights the matching lamp and Spark leans that way. The lesson is
 * "each direction on the pad maps to a place" — exactly what menu navigation
 * needs later. Discovered once all four directions have been tried.
 *
 * It responds to FOUR actions, so it can't be a single-Action Interactable; it
 * implements ManagedProp directly and lives in the same InteractableManager.
 */

import Phaser from "phaser";
import { Action } from "@/input/Action";
import { NEUTRAL_INPUT, NEUTRAL_INPUT_LIT, COLOR } from "@/config/Palette";
import { ControllerDiagram } from "@/ui/ControllerDiagram";
import { GhostHint } from "@/ui/GhostHint";
import type { ManagedProp, InteractContext } from "@/systems/Interactable";

interface Dir {
  action: Action;
  dx: number;
  dy: number;
  lamp: Phaser.GameObjects.Arc;
  seen: boolean;
}

export class DPadToy implements ManagedProp {
  readonly hint: GhostHint;
  private prompt: ControllerDiagram;
  private dirs: Dir[];
  private wasDown: Record<string, boolean> = {};

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const g = 46; // lamp offset from center
    const mk = (action: Action, dx: number, dy: number): Dir => ({
      action,
      dx,
      dy,
      lamp: scene.add
        .circle(x + dx * g, y + dy * g, 15, NEUTRAL_INPUT, 0.3)
        .setStrokeStyle(3, NEUTRAL_INPUT, 0.7)
        .setDepth(10),
      seen: false,
    });

    // Center hub, purely cosmetic.
    scene.add.circle(x, y, 10, COLOR.metalDark).setDepth(10);

    this.dirs = [
      mk(Action.DPAD_UP, 0, -1),
      mk(Action.DPAD_DOWN, 0, 1),
      mk(Action.DPAD_LEFT, -1, 0),
      mk(Action.DPAD_RIGHT, 1, 0),
    ];

    this.prompt = new ControllerDiagram(scene, "DPAD");
    this.prompt.setPosition(x, y - 100);

    this.hint = new GhostHint({
      onPulse: () => this.prompt.pulse(),
      onStopPulse: () => this.prompt.stopPulse(),
      onGhost: () => this.demo(scene),
      isDone: () => this.discovered,
    });
  }

  get discovered(): boolean {
    return this.dirs.every((d) => d.seen);
  }

  update(ctx: InteractContext): void {
    const input = ctx.services.input;
    for (const d of this.dirs) {
      const down = input.isDown(d.action);
      if (down && !this.wasDown[d.action]) {
        this.light(d);
        d.seen = true;
        ctx.services.audio.play("dpad");
        ctx.services.rumble.tap(0.4, 80);
        if (ctx.spark) {
          this.scene(d).tweens.add({
            targets: ctx.spark.container,
            x: ctx.spark.x + d.dx * 10,
            y: ctx.spark.y + d.dy * 10,
            duration: 100,
            yoyo: true,
            ease: "Sine.inOut",
          });
        }
        if (this.discovered) this.prompt.stopPulse();
      }
      this.wasDown[d.action] = down;
    }
  }

  private scene(d: Dir): Phaser.Scene {
    return d.lamp.scene;
  }

  private light(d: Dir): void {
    d.lamp.setFillStyle(NEUTRAL_INPUT_LIT, 1);
    d.lamp.scene.tweens.add({
      targets: d.lamp,
      scale: { from: 1.5, to: 1 },
      duration: 220,
      ease: "Quad.out",
      onComplete: () => d.lamp.setFillStyle(NEUTRAL_INPUT, 0.3),
    });
  }

  private demo(_scene: Phaser.Scene): void {
    // Light each direction in turn — "try these".
    this.dirs.forEach((d, i) => {
      d.lamp.scene.time.delayedCall(i * 180, () => this.light(d));
    });
  }

  destroy(): void {
    this.prompt.destroy();
    for (const d of this.dirs) d.lamp.destroy();
  }
}
