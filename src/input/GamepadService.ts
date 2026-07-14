/**
 * GamepadService.ts — raw Gamepad API polling.
 *
 * The ONLY module (besides Action's index map) that touches
 * navigator.getGamepads(). It normalizes one connected pad into a plain
 * snapshot. Everything above this reads InputState, never this.
 *
 * We rely on the browser "standard" mapping, which every modern Xbox pad
 * reports over USB and Bluetooth on Chromium/Firefox.
 */

import { TRIGGER_BUTTON } from "./Action";
import { TUNING } from "@/config/Tuning";

export interface RawPadSnapshot {
  connected: boolean;
  /** Digital pressed state per standard button index. */
  buttons: boolean[];
  /** Analog value 0..1 per button (triggers matter; most are 0/1). */
  buttonValues: number[];
  /** Left stick, raw -1..1. */
  lx: number;
  ly: number;
  /** Right stick, raw -1..1. */
  rx: number;
  ry: number;
  /** The live Gamepad for haptics (vibrationActuator). */
  gamepad: Gamepad | null;
}

const EMPTY: RawPadSnapshot = {
  connected: false,
  buttons: [],
  buttonValues: [],
  lx: 0,
  ly: 0,
  rx: 0,
  ry: 0,
  gamepad: null,
};

export class GamepadService {
  private activeIndex: number | null = null;

  constructor() {
    window.addEventListener("gamepadconnected", (e) => {
      const ge = e as GamepadEvent;
      if (this.activeIndex === null) this.activeIndex = ge.gamepad.index;
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      const ge = e as GamepadEvent;
      if (this.activeIndex === ge.gamepad.index) this.activeIndex = null;
    });
  }

  /** True if any pad is currently reporting. */
  get hasPad(): boolean {
    return this.poll().connected;
  }

  /** Read the current state of the active pad (or the first one available). */
  poll(): RawPadSnapshot {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad: Gamepad | null = null;

    if (this.activeIndex !== null && pads[this.activeIndex]) {
      pad = pads[this.activeIndex];
    } else {
      for (const p of pads) {
        if (p) {
          pad = p;
          this.activeIndex = p.index;
          break;
        }
      }
    }

    if (!pad) return EMPTY;

    const buttons = pad.buttons.map((b) => b.pressed);
    const buttonValues = pad.buttons.map((b) => b.value);

    // Some pads report triggers only as analog values; treat past-threshold as
    // pressed so digital edge detection works regardless of pad firmware.
    const lt = buttonValues[TRIGGER_BUTTON.LT] ?? 0;
    const rt = buttonValues[TRIGGER_BUTTON.RT] ?? 0;
    buttons[TRIGGER_BUTTON.LT] = lt >= TUNING.triggerThreshold;
    buttons[TRIGGER_BUTTON.RT] = rt >= TUNING.triggerThreshold;

    return {
      connected: true,
      buttons,
      buttonValues,
      lx: pad.axes[0] ?? 0,
      ly: pad.axes[1] ?? 0,
      rx: pad.axes[2] ?? 0,
      ry: pad.axes[3] ?? 0,
      gamepad: pad,
    };
  }
}
