/**
 * ControllerDiagram.ts — the ONLY non-letter prompt.
 *
 * For every input with no symbol on the physical pad (bumpers, triggers, stick
 * clicks, sticks, d-pad), we draw a small silhouette of the controller with the
 * relevant part lit and pulsing. The child looks at the picture, looks at his
 * hands, and matches. No `LB`/`RT` text ever — that is the whole point.
 *
 * Like ButtonPrompt, it takes an Action and derives the highlighted part from
 * ACTION_VISUAL. It cannot be told to light the wrong thing.
 */

import Phaser from "phaser";
import { DiagramPart } from "@/input/Action";
import { NEUTRAL_INPUT, NEUTRAL_INPUT_LIT } from "@/config/Palette";
import type { Prompt } from "./Prompt";

/** Geometry of the schematic pad, centered on (0,0). */
const PAD = {
  bodyW: 150,
  bodyH: 92,
  lstick: { x: -42, y: 6, r: 12 },
  rstick: { x: 28, y: 22, r: 12 },
  dpad: { x: -20, y: 26, s: 9 },
  face: { x: 46, y: -2, r: 15, dot: 5 },
  lb: { x: -46, y: -46, w: 34, h: 12 },
  rb: { x: 46, y: -46, w: 34, h: 12 },
  lt: { x: -46, y: -62, w: 26, h: 10 },
  rt: { x: 46, y: -62, w: 26, h: 10 },
};

export class ControllerDiagram implements Prompt {
  readonly container: Phaser.GameObjects.Container;
  private base: Phaser.GameObjects.Graphics;
  private highlight: Phaser.GameObjects.Graphics;
  private tiltDot?: Phaser.GameObjects.Arc;
  private pulseTween?: Phaser.Tweens.Tween;
  private tiltTween?: Phaser.Tweens.Tween;
  private readonly part: DiagramPart;

  constructor(scene: Phaser.Scene, part: DiagramPart) {
    this.part = part;

    this.base = scene.add.graphics();
    this.drawBase();

    this.highlight = scene.add.graphics();
    this.drawHighlight();

    const parts: Phaser.GameObjects.GameObject[] = [this.base, this.highlight];

    // For sticks, add a little dot that wiggles in the asked direction, so the
    // prompt reads as "tilt the stick", not just "the stick exists".
    if (this.part === "LSTICK" || this.part === "RSTICK") {
      const s = this.part === "LSTICK" ? PAD.lstick : PAD.rstick;
      this.tiltDot = scene.add.circle(s.x, s.y, 5, NEUTRAL_INPUT_LIT);
      parts.push(this.tiltDot);
      this.tiltTween = scene.tweens.add({
        targets: this.tiltDot,
        x: s.x + 8,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    this.container = scene.add.container(0, 0, parts);
    this.container.setDepth(50);
    this.container.setScale(0.62);
  }

  private drawBase(): void {
    const g = this.base;
    g.clear();
    // Body.
    g.fillStyle(0x2c3154, 1);
    g.lineStyle(2, NEUTRAL_INPUT, 0.5);
    g.fillRoundedRect(-PAD.bodyW / 2, -PAD.bodyH / 2, PAD.bodyW, PAD.bodyH, 26);
    g.strokeRoundedRect(-PAD.bodyW / 2, -PAD.bodyH / 2, PAD.bodyW, PAD.bodyH, 26);

    const dim = NEUTRAL_INPUT;
    // Sticks.
    g.fillStyle(dim, 0.5);
    g.fillCircle(PAD.lstick.x, PAD.lstick.y, PAD.lstick.r);
    g.fillCircle(PAD.rstick.x, PAD.rstick.y, PAD.rstick.r);
    // D-pad plus.
    const d = PAD.dpad;
    g.fillRect(d.x - d.s, d.y - d.s / 2, d.s * 2, d.s);
    g.fillRect(d.x - d.s / 2, d.y - d.s, d.s, d.s * 2);
    // Face button dots.
    const f = PAD.face;
    g.fillCircle(f.x, f.y - f.r * 0.6, f.dot);
    g.fillCircle(f.x, f.y + f.r * 0.6, f.dot);
    g.fillCircle(f.x - f.r * 0.6, f.y, f.dot);
    g.fillCircle(f.x + f.r * 0.6, f.y, f.dot);
    // Bumpers & triggers.
    g.fillStyle(dim, 0.4);
    this.roundRectCentered(g, PAD.lb);
    this.roundRectCentered(g, PAD.rb);
    this.roundRectCentered(g, PAD.lt);
    this.roundRectCentered(g, PAD.rt);
  }

  private drawHighlight(): void {
    const g = this.highlight;
    g.clear();
    g.fillStyle(NEUTRAL_INPUT_LIT, 1);
    g.lineStyle(2, NEUTRAL_INPUT_LIT, 1);

    switch (this.part) {
      case "LB":
        this.roundRectCentered(g, PAD.lb, true);
        break;
      case "RB":
        this.roundRectCentered(g, PAD.rb, true);
        break;
      case "LT":
        this.roundRectCentered(g, PAD.lt, true);
        break;
      case "RT":
        this.roundRectCentered(g, PAD.rt, true);
        break;
      case "L3":
      case "LSTICK":
        g.fillCircle(PAD.lstick.x, PAD.lstick.y, PAD.lstick.r);
        break;
      case "R3":
      case "RSTICK":
        g.fillCircle(PAD.rstick.x, PAD.rstick.y, PAD.rstick.r);
        break;
      case "DPAD": {
        // The whole cross — "your controller's d-pad".
        const d = PAD.dpad;
        g.fillRect(d.x - d.s, d.y - d.s / 2, d.s * 2, d.s);
        g.fillRect(d.x - d.s / 2, d.y - d.s, d.s, d.s * 2);
        break;
      }
      case "DPAD_LEFT":
        g.fillRect(PAD.dpad.x - PAD.dpad.s, PAD.dpad.y - PAD.dpad.s / 2, PAD.dpad.s, PAD.dpad.s);
        break;
      case "DPAD_RIGHT":
        g.fillRect(PAD.dpad.x, PAD.dpad.y - PAD.dpad.s / 2, PAD.dpad.s, PAD.dpad.s);
        break;
      case "DPAD_UP":
        g.fillRect(PAD.dpad.x - PAD.dpad.s / 2, PAD.dpad.y - PAD.dpad.s, PAD.dpad.s, PAD.dpad.s);
        break;
      case "DPAD_DOWN":
        g.fillRect(PAD.dpad.x - PAD.dpad.s / 2, PAD.dpad.y, PAD.dpad.s, PAD.dpad.s);
        break;
    }
  }

  private roundRectCentered(
    g: Phaser.GameObjects.Graphics,
    r: { x: number; y: number; w: number; h: number },
    fill = false
  ): void {
    if (fill) g.fillRoundedRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h, 5);
    else g.fillRoundedRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h, 5);
  }

  setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  setScale(s: number): this {
    this.container.setScale(0.62 * s);
    return this;
  }

  setVisible(v: boolean): this {
    this.container.setVisible(v);
    return this;
  }

  pulse(): void {
    if (this.pulseTween) return;
    this.pulseTween = this.container.scene.tweens.add({
      targets: this.highlight,
      alpha: { from: 1, to: 0.25 },
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  stopPulse(): void {
    this.pulseTween?.stop();
    this.pulseTween = undefined;
    this.highlight.setAlpha(1);
  }

  depress(): void {
    this.container.scene.tweens.add({
      targets: this.container,
      scaleX: this.container.scaleX * 0.9,
      scaleY: this.container.scaleY * 0.9,
      duration: 110,
      yoyo: true,
      ease: "Quad.out",
    });
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.tiltTween?.stop();
    this.container.destroy();
  }
}
