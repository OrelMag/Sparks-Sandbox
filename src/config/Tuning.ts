/**
 * Tuning.ts — THE playtest file.
 *
 * This is the file you touch after watching him play. Every number that affects
 * how the controller *feels* lives here, nowhere else. When he stalls, the fix
 * is almost always a number in this file or a ghost-hint timing — never a design
 * change and never a word on screen.
 *
 * Values are deliberately generous. This is a toy for a 7-year-old, not a test.
 */

export const TUNING = {
  /** Stick input conditioning. See InputState.applyRadialDeadzone. */
  stick: {
    /** Below this magnitude the stick reads as centered. Radial, not per-axis. */
    deadzone: 0.18,
    /** Above this magnitude the stick reads as fully deflected. */
    saturation: 0.95,
  },

  /** Analog trigger (LT/RT) press threshold — how far he must pull. Forgiving. */
  triggerThreshold: 0.4,

  /** Movement speeds (px/sec). */
  move: {
    axisSpeed: 380, // P2a horizontal catch
    freeRoamSpeed: 300, // P2b sheep pen
    dashMultiplier: 2.1, // L3 sprint
    tankSpeed: 260, // P3 body
    puzzleSpeed: 280, // P4
  },

  /** Turret aim (P3): how fast the cannon swings toward the right-stick angle. */
  aim: {
    turnLerp: 0.25, // 0..1 per frame; higher = snappier
    sprayRange: 260,
  },

  /** Phase 2 assist. Missing must never feel like failing. */
  gears: {
    magnetRadius: 90, // gears drift toward Spark within this range
    magnetStrength: 220, // px/sec pull
    unlockCount: 6, // catch this many and the pen walls fall away
  },

  /** Phase 2b: sheep to herd into the corral before P2 is "done". */
  sheep: {
    count: 4,
  },

  /** Escalating wordless hints. The tutorial IS these two timers. */
  hints: {
    pulseAfter: 6.0, // s idle → the prompt starts pulsing
    ghostAfter: 12.0, // s idle → a translucent Spark demos the action once
    ghostReplayEvery: 8.0, // s → replay the ghost if still idle
  },

  /** Haptics. The buzz in his palms is doing real teaching in P1. */
  rumble: {
    tapMs: 120,
    tapStrength: 0.6,
    holdStrength: 0.35,
  },

  /** How gently world edges push Spark back. Zero failure states = no falling. */
  softClampPush: 8, // px/frame nudge back inside bounds

  /** Hold A this long inside a level door to avoid accidental exits. */
  exitHoldMs: 900,
} as const;
