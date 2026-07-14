/**
 * ButtonPrompt.ts — a color-matched face-button prompt.
 *
 * Shows a rounded button in the EXACT Xbox color of its action, with the letter
 * drawn (not typed) on top. This is the literal color-mapping lesson: the green
 * ring on screen is the green button under his thumb.
 *
 * Crucially, the constructor takes an Action and NOTHING else — no color, no
 * glyph override. Both are pulled from ACTION_VISUAL. A red 'A' is unbuildable.
 */

import Phaser from "phaser";
import { Action, ACTION_VISUAL } from "@/input/Action";
import { drawGlyph, Glyph } from "./GlyphIcon";
import type { Prompt } from "./Prompt";

const SIZE = 46;

export class ButtonPrompt implements Prompt {
  readonly container: Phaser.GameObjects.Container;
  private ring: Phaser.GameObjects.Arc;
  private face: Phaser.GameObjects.Arc;
  private glyphGfx: Phaser.GameObjects.Graphics;
  private pulseTween?: Phaser.Tweens.Tween;
  private readonly color: number;

  constructor(scene: Phaser.Scene, action: Action) {
    const visual = ACTION_VISUAL[action];
    if (visual.kind !== "glyph" || !visual.glyph) {
      throw new Error(`ButtonPrompt requires a glyph action, got ${action}`);
    }
    this.color = visual.color;

    // Outer colored ring + darker face, like a real button cap.
    this.ring = scene.add.circle(0, 0, SIZE * 0.62, this.color, 1);
    this.face = scene.add.circle(0, 0, SIZE * 0.5, darken(this.color, 0.55), 1);
    this.glyphGfx = scene.add.graphics();
    drawGlyph(this.glyphGfx, visual.glyph as Glyph, SIZE * 0.5, this.color);

    this.container = scene.add.container(0, 0, [this.ring, this.face, this.glyphGfx]);
    this.container.setDepth(50);

    // A gentle idle bob so the prompt always reads as "alive/interactive".
    scene.tweens.add({
      targets: this.container,
      y: "-=4",
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  setScale(s: number): this {
    this.container.setScale(s);
    return this;
  }

  setVisible(v: boolean): this {
    this.container.setVisible(v);
    return this;
  }

  pulse(): void {
    if (this.pulseTween) return;
    this.pulseTween = this.container.scene.tweens.add({
      targets: [this.ring],
      scale: 1.35,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  stopPulse(): void {
    this.pulseTween?.stop();
    this.pulseTween = undefined;
    this.ring.setScale(1).setAlpha(1);
  }

  depress(): void {
    // Squash the button inward, as if a thumb pressed it.
    const scene = this.container.scene;
    scene.tweens.add({
      targets: this.container,
      scaleX: 0.82,
      scaleY: 0.82,
      duration: 90,
      yoyo: true,
      ease: "Quad.out",
    });
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.container.destroy();
  }
}

/** Multiply an RGB hex toward black. Local helper — not a new palette entry. */
function darken(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const g = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
