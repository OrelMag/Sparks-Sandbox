/**
 * KeyboardFallback.ts — keyboard mapped onto the Action surface.
 *
 * Not a player-facing feature: it is how we develop without a pad plugged in,
 * and it guarantees no code path assumes a gamepad exists. The mappings mirror
 * the controller so that testing feels like the real thing.
 *
 *   WASD           → move (left stick)
 *   Arrow keys     → aim  (right stick)
 *   Space / J      → JUMP (A)      K → CANCEL (B)
 *   L → ALT (X)    I → EXTRA (Y)
 *   Enter          → FIRE (RT)     Shift → BRACE (LT)
 *   Q → BUMP_L     E → BUMP_R      F → DASH (L3)
 *   Numpad / IJKL-less: dpad via T/F/G/H  (up/left/down/right)
 */

import { Action } from "./Action";
import { Vec2 } from "./InputState";

const KEY_TO_ACTION: Record<string, Action> = {
  Space: Action.JUMP,
  KeyJ: Action.JUMP,
  KeyK: Action.CANCEL,
  KeyL: Action.ALT,
  KeyI: Action.EXTRA,
  Enter: Action.FIRE,
  ShiftLeft: Action.BRACE,
  ShiftRight: Action.BRACE,
  KeyQ: Action.BUMP_L,
  KeyE: Action.BUMP_R,
  KeyF: Action.DASH,
  KeyT: Action.DPAD_UP,
  KeyG: Action.DPAD_DOWN,
  KeyR: Action.DPAD_LEFT, // 'r' left of 'g' cluster; avoids WASD clash
  KeyY: Action.DPAD_RIGHT,
};

export class KeyboardFallback {
  private down = new Set<string>();

  attach(target: Window = window): void {
    target.addEventListener("keydown", (e) => {
      // Prevent Space/arrows from scrolling the page.
      if (
        e.code === "Space" ||
        e.code.startsWith("Arrow")
      ) {
        e.preventDefault();
      }
      this.down.add(e.code);
    });
    target.addEventListener("keyup", (e) => this.down.delete(e.code));
    target.addEventListener("blur", () => this.down.clear());
  }

  /** Actions currently held via keyboard. */
  pollActions(): Action[] {
    const out: Action[] = [];
    for (const code of this.down) {
      const a = KEY_TO_ACTION[code];
      if (a) out.push(a);
    }
    return out;
  }

  moveVector(): Vec2 {
    let x = 0;
    let y = 0;
    if (this.down.has("KeyA")) x -= 1;
    if (this.down.has("KeyD")) x += 1;
    if (this.down.has("KeyW")) y -= 1;
    if (this.down.has("KeyS")) y += 1;
    return { x, y };
  }

  aimVector(): Vec2 {
    let x = 0;
    let y = 0;
    if (this.down.has("ArrowLeft")) x -= 1;
    if (this.down.has("ArrowRight")) x += 1;
    if (this.down.has("ArrowUp")) y -= 1;
    if (this.down.has("ArrowDown")) y += 1;
    return { x, y };
  }
}
