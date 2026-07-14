/**
 * PuzzleController.ts — Phase 4 (skills 7 & 8).
 *
 * Free-roam movement so Spark can walk the automation rooms and shove batteries
 * around (pushing is arcade-physics collision, set up by the scene). Holding LT
 * (Action.BRACE) locks Spark in place — the "brace" half of the LT+A conveyor
 * chord. Locking is what turns a casual A-press into a deliberate two-finger
 * action, which is the skill being drilled.
 */

import type { SparkController } from "./SparkController";
import type { Spark } from "../Spark";
import type { InputState } from "@/input/InputState";
import { Action } from "@/input/Action";
import { TUNING } from "@/config/Tuning";

export class PuzzleController implements SparkController {
  update(spark: Spark, input: InputState, _dt: number): void {
    if (input.isDown(Action.BRACE)) {
      // Locked/braced — a little squash tells him he's rooted.
      spark.setVelocity(0, 0);
      spark.container.setScale(1.06, 0.94);
      return;
    }
    spark.container.setScale(1, 1);
    spark.setVelocity(
      input.move.x * TUNING.move.puzzleSpeed,
      input.move.y * TUNING.move.puzzleSpeed
    );
  }
}
