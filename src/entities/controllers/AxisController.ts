/**
 * AxisController.ts — Phase 2a (skill 2: one analog axis).
 *
 * Left stick, LEFT AND RIGHT ONLY. Spark is pinned to a horizontal line at the
 * bottom of the screen and slides side to side to catch falling gears. Deliberately
 * one-dimensional: it isolates "tilt the stick, the robot slides" before the full
 * 2D plane arrives in 2b. The vertical axis is ignored on purpose.
 */

import type { SparkController } from "./SparkController";
import type { Spark } from "../Spark";
import type { InputState } from "@/input/InputState";
import { TUNING } from "@/config/Tuning";

export class AxisController implements SparkController {
  constructor(private lineY: number) {}

  update(spark: Spark, input: InputState, _dt: number): void {
    spark.setVelocity(input.move.x * TUNING.move.axisSpeed, 0);
    // Keep Spark exactly on the catch line — no drift up or down.
    if (spark.y !== this.lineY) spark.setPosition(spark.x, this.lineY);
  }
}
