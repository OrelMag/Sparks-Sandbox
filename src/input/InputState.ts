/**
 * InputState.ts — the per-frame semantic snapshot.
 *
 * Gameplay asks this object questions: justPressed(Action.JUMP), isDown(...),
 * moveVector, aimVector. It fuses gamepad + keyboard into one surface, so no
 * gameplay code cares which one is plugged in.
 *
 * The radial-deadzone math (applyRadialDeadzone) is a pure exported function so
 * it can be unit-tested. It is the five lines that decide whether Phase 2 feels
 * smooth or feels like the robot fighting a 7-year-old's thumb.
 */

import { Action, ALL_ACTIONS, BUTTON_TO_ACTION } from "./Action";
import { GamepadService, RawPadSnapshot } from "./GamepadService";
import { KeyboardFallback } from "./KeyboardFallback";
import { TUNING } from "@/config/Tuning";

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Radial deadzone with magnitude rescaling. Treats the stick as a 2D vector,
 * NOT two independent axes — per-axis deadzones create a "sticky cross" where
 * diagonals die. Inside `deadzone` → zero. Between deadzone and `saturation`,
 * remap magnitude to 0..1 so control ramps smoothly from the first millimeter.
 *
 * Pure function: (raw x, raw y) → conditioned vector. Unit-tested.
 */
export function applyRadialDeadzone(
  x: number,
  y: number,
  deadzone: number = TUNING.stick.deadzone,
  saturation: number = TUNING.stick.saturation
): Vec2 {
  const mag = Math.hypot(x, y);
  // `<=` (not `<`) is load-bearing: with deadzone 0 and a centered stick, mag is
  // exactly 0, and `0 < 0` would fall through to `x / mag` → NaN, corrupting
  // every downstream velocity. `<=` returns a clean zero for the centered case.
  if (mag <= deadzone) return { x: 0, y: 0 };

  const clamped = Math.min(mag, saturation);
  const scaled = (clamped - deadzone) / (saturation - deadzone); // 0..1
  const nx = x / mag;
  const ny = y / mag;
  return { x: nx * scaled, y: ny * scaled };
}

export class InputState {
  private prevDown: Record<string, boolean> = {};
  private currDown: Record<string, boolean> = {};

  private _move: Vec2 = { x: 0, y: 0 };
  private _aim: Vec2 = { x: 0, y: 0 };
  private _raw: RawPadSnapshot | null = null;
  /** Whether the pad (not keyboard) produced input this frame — for prompts. */
  private _usingPad = false;

  constructor(
    private pad: GamepadService,
    private keys: KeyboardFallback
  ) {
    for (const a of ALL_ACTIONS) {
      this.prevDown[a] = false;
      this.currDown[a] = false;
    }
  }

  /** Call once per frame, before gameplay reads anything. */
  update(): void {
    this.prevDown = { ...this.currDown };
    for (const a of ALL_ACTIONS) this.currDown[a] = false;

    const raw = this.pad.poll();
    this._raw = raw;
    this._usingPad = raw.connected;

    // --- discrete actions from pad buttons ---
    if (raw.connected) {
      raw.buttons.forEach((pressed, index) => {
        if (!pressed) return;
        const action = BUTTON_TO_ACTION[index];
        if (action) this.currDown[action] = true;
      });
    }

    // --- discrete actions from keyboard (same Action surface) ---
    const keyActions = this.keys.pollActions();
    for (const a of keyActions) this.currDown[a] = true;

    // --- analog move: pad left stick, else keyboard WASD ---
    if (raw.connected && (Math.abs(raw.lx) > 0.02 || Math.abs(raw.ly) > 0.02)) {
      this._move = applyRadialDeadzone(raw.lx, raw.ly);
    } else {
      const k = this.keys.moveVector();
      this._move = applyRadialDeadzone(k.x, k.y, 0, 1);
      if (k.x !== 0 || k.y !== 0) this._usingPad = false;
    }

    // --- analog aim: pad right stick, else keyboard arrows ---
    if (raw.connected && (Math.abs(raw.rx) > 0.02 || Math.abs(raw.ry) > 0.02)) {
      this._aim = applyRadialDeadzone(raw.rx, raw.ry);
    } else {
      const k = this.keys.aimVector();
      this._aim = applyRadialDeadzone(k.x, k.y, 0, 1);
    }
  }

  justPressed(a: Action): boolean {
    return this.currDown[a] && !this.prevDown[a];
  }

  justReleased(a: Action): boolean {
    return !this.currDown[a] && this.prevDown[a];
  }

  isDown(a: Action): boolean {
    return this.currDown[a];
  }

  /** True if ANY of the given actions is down (e.g. either bumper). */
  anyDown(...actions: Action[]): boolean {
    return actions.some((a) => this.currDown[a]);
  }

  /** True only if ALL given actions are down THIS frame — the AND-gate primitive. */
  allDown(...actions: Action[]): boolean {
    return actions.every((a) => this.currDown[a]);
  }

  get move(): Vec2 {
    return this._move;
  }

  get aim(): Vec2 {
    return this._aim;
  }

  /** Magnitude of the aim stick, for "is he aiming" checks. */
  get aimMagnitude(): number {
    return Math.hypot(this._aim.x, this._aim.y);
  }

  get usingPad(): boolean {
    return this._usingPad;
  }

  get raw(): RawPadSnapshot | null {
    return this._raw;
  }
}
