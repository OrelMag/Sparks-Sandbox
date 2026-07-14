/**
 * FreeRoamController.ts — Phase 2b (skills 3 & 4).
 *
 * Full 2D top-down movement from the left stick — this is "move" in every real
 * game. Clicking the left stick (L3 / Action.DASH) sprints, which is skill 4:
 * an analog direction plus a button chord, held together. Spark visibly leans
 * and streaks while dashing so the chord has an obvious payoff.
 */

import type { SparkController } from "./SparkController";
import type { Spark } from "../Spark";
import type { InputState } from "@/input/InputState";
import { Action } from "@/input/Action";
import { TUNING } from "@/config/Tuning";

export class FreeRoamController implements SparkController {
  update(spark: Spark, input: InputState, _dt: number): void {
    const dashing = input.isDown(Action.DASH);
    const speed =
      TUNING.move.freeRoamSpeed * (dashing ? TUNING.move.dashMultiplier : 1);
    spark.setVelocity(input.move.x * speed, input.move.y * speed);

    // Point Spark's facing along travel, for a little lean.
    if (Math.hypot(input.move.x, input.move.y) > 0.1) {
      spark.faceAngle(Math.atan2(input.move.y, input.move.x));
    }
  }
}
