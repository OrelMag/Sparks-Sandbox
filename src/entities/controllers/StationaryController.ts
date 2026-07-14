/**
 * StationaryController.ts — Phase 1.
 *
 * Spark does not move at all. The screen is a digital activity board: the whole
 * lesson is "my thumb makes the robot do a thing", with zero locomotion to
 * distract from the button→effect mapping. Reactions are driven by the scene's
 * interactables calling Spark's juice methods, not by this controller.
 */

import type { SparkController } from "./SparkController";
import type { Spark } from "../Spark";
import type { InputState } from "@/input/InputState";

export class StationaryController implements SparkController {
  update(spark: Spark, _input: InputState, _dt: number): void {
    // Intentionally still. Hold position; damp any residual velocity.
    spark.setVelocity(0, 0);
  }
}
