/**
 * Wire.ts — a visible power line between automation pieces.
 *
 * The wire is the wordless truth table: power visibly flows along it (bright,
 * animated) only when its source node is powered, and stops dead otherwise. A
 * 7-year-old can read "both switches → the wire lights → the bridge moves" with
 * his eyes, never a word.
 */

import Phaser from "phaser";
import { COLOR } from "@/config/Palette";
import type { SignalNode } from "@/systems/logic/SignalGraph";

export class Wire {
  private g: Phaser.GameObjects.Graphics;
  private pulses: Phaser.GameObjects.Arc[] = [];
  private points: Phaser.Math.Vector2[];

  constructor(
    scene: Phaser.Scene,
    points: [number, number][],
    private source: SignalNode
  ) {
    this.points = points.map(([x, y]) => new Phaser.Math.Vector2(x, y));
    this.g = scene.add.graphics().setDepth(4);

    // Traveling energy dots, shown only while powered.
    for (let i = 0; i < 3; i++) {
      this.pulses.push(scene.add.circle(0, 0, 5, COLOR.wireOn).setDepth(5).setVisible(false));
    }
  }

  update(time: number): void {
    const on = this.source.isPowered();
    this.g.clear();
    this.g.lineStyle(6, on ? COLOR.wireOn : COLOR.wireOff, 1);
    this.g.beginPath();
    this.g.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.g.lineTo(this.points[i].x, this.points[i].y);
    }
    this.g.strokePath();

    // Animate energy dots crawling toward the sink when powered.
    this.pulses.forEach((p, i) => {
      p.setVisible(on);
      if (!on) return;
      const t = ((time / 900 + i / this.pulses.length) % 1);
      const pos = this.pointAt(t);
      p.setPosition(pos.x, pos.y);
    });
  }

  /** Position along the polyline at parameter t (0..1), by segment length. */
  private pointAt(t: number): Phaser.Math.Vector2 {
    const segs: number[] = [];
    let total = 0;
    for (let i = 1; i < this.points.length; i++) {
      const d = this.points[i].distance(this.points[i - 1]);
      segs.push(d);
      total += d;
    }
    let target = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (target <= segs[i]) {
        const f = segs[i] === 0 ? 0 : target / segs[i];
        return this.points[i].clone().lerp(this.points[i + 1], f);
      }
      target -= segs[i];
    }
    return this.points[this.points.length - 1].clone();
  }
}
