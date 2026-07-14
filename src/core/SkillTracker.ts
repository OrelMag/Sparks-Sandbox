/**
 * SkillTracker.ts — the pedagogical instrument.
 *
 * Records what the player has DISCOVERED and how well he controls the sticks.
 * Feeds two things: (1) skill-gated world unlocks, and (2) the parent-facing
 * Observation Mode overlay. The child never sees any of this; it is how we know
 * the toy is teaching. A pedagogical goal you can't measure is a wish.
 *
 * Deliberately holds no failure concept — only evidence of skills GAINED.
 */

import { Action } from "@/input/Action";

export interface SkillReport {
  discovered: Set<string>;
  /** Rolling mean stick magnitude while moving — proxy for fine control. */
  avgStickPrecision: number;
  /**
   * Phase-3 independence ratio: fraction of "active" frames where BOTH sticks
   * moved at once. The single number that says whether skill 5 landed.
   */
  independenceRatio: number;
  totalActiveFrames: number;
}

export class SkillTracker {
  private discovered = new Set<string>();

  private precisionSum = 0;
  private precisionSamples = 0;

  private bothSticksFrames = 0;
  private eitherStickFrames = 0;
  private activeFrames = 0;

  /** Mark a discrete input as discovered the first time it's used. */
  markAction(a: Action): void {
    this.discovered.add(a);
  }

  markInput(id: string): void {
    this.discovered.add(id);
  }

  has(id: string): boolean {
    return this.discovered.has(id);
  }

  /** Call each frame with the conditioned stick magnitudes (0..1). */
  sampleSticks(moveMag: number, aimMag: number): void {
    const moving = moveMag > 0.05;
    const aiming = aimMag > 0.05;
    if (moving) {
      this.precisionSum += moveMag;
      this.precisionSamples++;
      this.markInput("LSTICK");
    }
    if (aiming) this.markInput("RSTICK");

    if (moving || aiming) {
      this.eitherStickFrames++;
      this.activeFrames++;
      if (moving && aiming) this.bothSticksFrames++;
    }
  }

  report(): SkillReport {
    return {
      discovered: new Set(this.discovered),
      avgStickPrecision:
        this.precisionSamples > 0 ? this.precisionSum / this.precisionSamples : 0,
      independenceRatio:
        this.eitherStickFrames > 0 ? this.bothSticksFrames / this.eitherStickFrames : 0,
      totalActiveFrames: this.activeFrames,
    };
  }
}
