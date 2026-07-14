/**
 * TankController.ts — Phase 3 (skills 5 & 6), the body half.
 *
 * The left stick drives the truck around the arena. Deliberately DIRECT 2D
 * movement (stick direction → travel direction), not tank-tread rotate-and-
 * throttle: the lesson here is moving and aiming INDEPENDENTLY, and true tank
 * steering would add a second hard skill on top. The turret (right stick) and
 * the water cannon (RT) are handled by WaterCannon, so this controller only
 * moves the body — the two thumbs stay cleanly separated in code, mirroring how
 * they must stay separated in his hands.
 */

import type { SparkController } from "./SparkController";
import type { Spark } from "../Spark";
import type { InputState } from "@/input/InputState";
import { TUNING } from "@/config/Tuning";

export class TankController implements SparkController {
  update(spark: Spark, input: InputState, _dt: number): void {
    const v = input.move;
    spark.setVelocity(v.x * TUNING.move.tankSpeed, v.y * TUNING.move.tankSpeed);
  }
}
