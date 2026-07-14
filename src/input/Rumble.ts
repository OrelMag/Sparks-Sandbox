/**
 * Rumble.ts — haptic feedback wrapper.
 *
 * The buzz in his palms at the instant Spark reacts is doing real teaching in
 * Phase 1 ("my thumb controls this robot"). With no words available, this is a
 * genuine feedback channel, not decoration.
 *
 * Uses the experimental gamepad.vibrationActuator. No-ops safely on pads /
 * browsers that lack it, so callers never need to guard.
 */

import { GamepadService } from "./GamepadService";
import { TUNING } from "@/config/Tuning";

interface VibrationActuatorLike {
  playEffect(
    type: string,
    params: {
      duration: number;
      strongMagnitude?: number;
      weakMagnitude?: number;
      startDelay?: number;
    }
  ): Promise<string>;
}

export class Rumble {
  constructor(private pad: GamepadService) {}

  private actuator(): VibrationActuatorLike | null {
    const gp = this.pad.poll().gamepad as (Gamepad & {
      vibrationActuator?: VibrationActuatorLike;
    }) | null;
    return gp?.vibrationActuator ?? null;
  }

  /** A short confirming tap — the default "you did a thing" buzz. */
  tap(strength: number = TUNING.rumble.tapStrength, ms: number = TUNING.rumble.tapMs): void {
    this.play(ms, strength, strength * 0.5);
  }

  /** A gentle sustained hum, e.g. while BRACE is held. */
  hold(ms = 200): void {
    this.play(ms, TUNING.rumble.holdStrength, 0.1);
  }

  private play(duration: number, strong: number, weak: number): void {
    const act = this.actuator();
    if (!act) return;
    // Fire-and-forget; ignore rejection on unsupported pads.
    void act
      .playEffect("dual-rumble", {
        duration,
        strongMagnitude: strong,
        weakMagnitude: weak,
      })
      .catch(() => {});
  }
}
