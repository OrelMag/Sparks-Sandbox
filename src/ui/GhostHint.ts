/**
 * GhostHint.ts — the wordless tutorial, as a state machine.
 *
 * This single system teaches every phase. It watches a shared idle clock (time
 * since the player last did ANYTHING) and escalates in two steps:
 *
 *   idle ≥ pulseAfter  → the prompt pulses ("hey, this one").
 *   idle ≥ ghostAfter  → a translucent demo plays: the prompt depresses and
 *                        Spark performs the action once, faintly, then resets.
 *                        Replays every `replayEvery` seconds while still idle.
 *
 * It never blocks, never nags, never speaks. Any input resets the clock and
 * settles the hint. Once the prop is discovered (`isDone`), it goes quiet for
 * good. The escalation logic is decoupled from *what* the demo looks like: the
 * prop supplies `onGhost`, so a spring, a fan, or a switch each demo themselves.
 */

import { TUNING } from "@/config/Tuning";

export interface GhostHintConfig {
  onPulse: () => void;
  onStopPulse: () => void;
  /** Play the prop's own one-shot demonstration. */
  onGhost: () => void;
  /** Once true, the hint stays silent (the child has learned this one). */
  isDone?: () => boolean;
  pulseAfter?: number;
  ghostAfter?: number;
  replayEvery?: number;
}

export class GhostHint {
  private pulsing = false;
  private lastGhostAt = -Infinity;
  private readonly pulseAfter: number;
  private readonly ghostAfter: number;
  private readonly replayEvery: number;

  constructor(private cfg: GhostHintConfig) {
    this.pulseAfter = cfg.pulseAfter ?? TUNING.hints.pulseAfter;
    this.ghostAfter = cfg.ghostAfter ?? TUNING.hints.ghostAfter;
    this.replayEvery = cfg.replayEvery ?? TUNING.hints.ghostReplayEvery;
  }

  /** Called each frame by the scene with the current global idle time (s). */
  tick(idleSeconds: number): void {
    if (this.cfg.isDone?.()) {
      this.settle();
      return;
    }

    if (idleSeconds >= this.ghostAfter) {
      if (idleSeconds - this.lastGhostAt >= this.replayEvery) {
        this.lastGhostAt = idleSeconds;
        this.cfg.onGhost();
      }
      this.ensurePulse();
    } else if (idleSeconds >= this.pulseAfter) {
      this.ensurePulse();
    } else {
      this.settle();
    }
  }

  /** Called when the player does anything — the clock is being reset. */
  reset(): void {
    this.lastGhostAt = -Infinity;
    this.settle();
  }

  private ensurePulse(): void {
    if (!this.pulsing) {
      this.pulsing = true;
      this.cfg.onPulse();
    }
  }

  private settle(): void {
    if (this.pulsing) {
      this.pulsing = false;
      this.cfg.onStopPulse();
    }
  }
}
