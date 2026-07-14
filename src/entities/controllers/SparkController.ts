/**
 * SparkController.ts — the movement slot.
 *
 * Spark's body and juice are constant across the whole game; only *how he moves*
 * changes per phase. That behavior is a swappable controller implementing this
 * interface. A new phase is a new controller, not a new robot — which is what
 * makes the progression feel like one robot learning, and keeps phases cheap.
 *
 * Concrete controllers: Stationary (P1) · Axis (P2a) · FreeRoam (P2b) ·
 * Tank (P3) · Puzzle (P4).
 */

import type { InputState } from "@/input/InputState";
import type { Spark } from "../Spark";

export interface SparkController {
  /** Update Spark's motion for this frame. dt is in seconds. */
  update(spark: Spark, input: InputState, dt: number): void;
}
