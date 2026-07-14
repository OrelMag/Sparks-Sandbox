/**
 * DebugInputScene.ts — the input-spine proof.
 *
 * Renders every button and both sticks live, so we can confirm the Gamepad
 * mapping, radial deadzone, and keyboard fallback all work before any real
 * teaching UI exists. This is a DEV scene: it uses text freely (it is not part
 * of the game the child plays) and is reached via ?scene=debug.
 *
 * It is intentionally NOT in the guard allowlist for Text because it lives
 * outside the shipped game flow; if it ever needs to ship, it wouldn't.
 */

import Phaser from "phaser";
import { getServices } from "@/core/Services";
import { Action, ACTION_VISUAL, ALL_ACTIONS } from "@/input/Action";
import { GAME_WIDTH } from "@/config/GameConfig";

export class DebugInputScene extends Phaser.Scene {
  constructor() {
    // Not auto-started: only BootScene (index 0) starts scenes, and only reaches
    // here via ?scene=debug. Keeps this dev tool out of the normal game flow.
    super({ key: "debug", active: false });
  }

  private labels: Partial<Record<Action, Phaser.GameObjects.Text>> = {};
  private moveDot!: Phaser.GameObjects.Arc;
  private aimDot!: Phaser.GameObjects.Arc;
  private status!: Phaser.GameObjects.Text;

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, 30, "INPUT DEBUG  —  press buttons / move sticks", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);

    // Button state column.
    let y = 90;
    for (const a of ALL_ACTIONS) {
      const v = ACTION_VISUAL[a];
      const hex = "#" + v.color.toString(16).padStart(6, "0");
      const t = this.add.text(80, y, "", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: hex,
      });
      this.labels[a] = t;
      y += 30;
    }

    // Stick visualizers.
    const drawStick = (cx: number, cy: number, label: string) => {
      this.add.circle(cx, cy, 90, 0x222848).setStrokeStyle(2, 0x556);
      this.add
        .text(cx, cy - 120, label, {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#aab",
        })
        .setOrigin(0.5);
    };
    drawStick(760, 300, "LEFT STICK (move)");
    drawStick(1020, 300, "RIGHT STICK (aim)");

    // Deadzone rings (static, just for visual reference).
    this.add.circle(760, 300, 90 * 0.18, 0x000000).setStrokeStyle(1, 0x445);
    this.add.circle(1020, 300, 90 * 0.18, 0x000000).setStrokeStyle(1, 0x445);
    this.moveDot = this.add.circle(760, 300, 10, 0x16c60c);
    this.aimDot = this.add.circle(1020, 300, 10, 0x0078d7);

    this.status = this.add.text(760, 430, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#ffd166",
    });
  }

  update(): void {
    const { input, skills } = getServices(this);
    input.update();

    for (const a of ALL_ACTIONS) {
      const held = input.isDown(a);
      const label = this.labels[a];
      if (label) {
        label.setText(`${held ? "[X]" : "[ ]"} ${a}`);
        label.setAlpha(held ? 1 : 0.45);
      }
    }

    const mv = input.move;
    const am = input.aim;
    this.moveDot.setPosition(760 + mv.x * 90, 300 + mv.y * 90);
    this.aimDot.setPosition(1020 + am.x * 90, 300 + am.y * 90);

    skills.sampleSticks(Math.hypot(mv.x, mv.y), Math.hypot(am.x, am.y));
    const rep = skills.report();
    this.status.setText(
      [
        `pad: ${input.usingPad ? "GAMEPAD" : "keyboard"}`,
        `move: ${mv.x.toFixed(2)}, ${mv.y.toFixed(2)}`,
        `aim:  ${am.x.toFixed(2)}, ${am.y.toFixed(2)}`,
        `independence ratio: ${(rep.independenceRatio * 100).toFixed(0)}%`,
      ].join("\n")
    );
  }
}
