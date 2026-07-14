/**
 * GlyphIcon.ts — the face-button letters, drawn as vector strokes.
 *
 * The carve-out in CLAUDE.md says A/B/X/Y are icons that happen to be letters:
 * the child shape-matches them against his thumb, he doesn't read them. We honor
 * that literally by DRAWING each letter with Graphics strokes rather than using
 * a Text object. So there is no text anywhere — the guard passes with no
 * exception, and the glyph is genuinely a picture of a letter.
 *
 * Each drawer strokes inside a box of the given `size`, centered on (0,0).
 */

import Phaser from "phaser";

export type Glyph = "A" | "B" | "X" | "Y";

export function drawGlyph(
  g: Phaser.GameObjects.Graphics,
  glyph: Glyph,
  size: number,
  color: number,
  thickness = Math.max(3, size * 0.13)
): void {
  g.lineStyle(thickness, color, 1);
  const h = size / 2; // half-extent
  const w = size * 0.34; // letter half-width

  switch (glyph) {
    case "A": {
      // Two legs meeting at the apex, plus a crossbar.
      g.beginPath();
      g.moveTo(-w, h);
      g.lineTo(0, -h);
      g.lineTo(w, h);
      g.strokePath();
      g.beginPath();
      g.moveTo(-w * 0.55, h * 0.25);
      g.lineTo(w * 0.55, h * 0.25);
      g.strokePath();
      break;
    }
    case "X": {
      g.beginPath();
      g.moveTo(-w, -h);
      g.lineTo(w, h);
      g.strokePath();
      g.beginPath();
      g.moveTo(w, -h);
      g.lineTo(-w, h);
      g.strokePath();
      break;
    }
    case "Y": {
      g.beginPath();
      g.moveTo(-w, -h);
      g.lineTo(0, 0);
      g.lineTo(w, -h);
      g.strokePath();
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, h);
      g.strokePath();
      break;
    }
    case "B": {
      // Vertical spine + two bowls, approximated with arcs.
      g.beginPath();
      g.moveTo(-w, -h);
      g.lineTo(-w, h);
      g.strokePath();
      // Top bowl.
      g.beginPath();
      g.arc(-w, -h * 0.5, h * 0.5, -Math.PI / 2, Math.PI / 2, false);
      g.strokePath();
      // Bottom bowl.
      g.beginPath();
      g.arc(-w, h * 0.5, h * 0.5, -Math.PI / 2, Math.PI / 2, false);
      g.strokePath();
      break;
    }
  }
}
