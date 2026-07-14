/**
 * Action.ts — the semantic input surface.
 *
 * Gameplay code speaks in Actions, never in raw button indices. An Action is
 * "the thing the player wants to do"; the binding to a physical control, its
 * prompt color, its glyph, and its sound all live here in ONE map. This is the
 * chokepoint that makes golden rule 2 (literal color mapping) structural:
 * a prompt's color is derived from its Action, and there is no other source.
 *
 * The transfer rule (CLAUDE.md) is encoded in these bindings: RT is the primary
 * action, A is jump/confirm, B is cancel, LS moves, RS aims. Change a binding
 * here and the whole game — prompts, colors, sounds, keyboard fallback — follows.
 */

import { XBOX_BUTTON, NEUTRAL_INPUT } from "@/config/Palette";

/** Discrete (pressed/released) actions. Analog move/aim are handled separately. */
export enum Action {
  // Face buttons — skill 0. Each keeps its console-convention role.
  JUMP = "JUMP", // A / green
  CANCEL = "CANCEL", // B / red
  ALT = "ALT", // X / blue
  EXTRA = "EXTRA", // Y / yellow

  // Shoulders & triggers — skills 6,7,8.
  FIRE = "FIRE", // RT — the PRIMARY action (transfer rule)
  BRACE = "BRACE", // LT — hold to lock/brace
  BUMP_L = "BUMP_L", // LB
  BUMP_R = "BUMP_R", // RB

  // Stick click — skill 4.
  DASH = "DASH", // L3 — sprint

  // D-pad — skill 1.
  DPAD_LEFT = "DPAD_LEFT",
  DPAD_RIGHT = "DPAD_RIGHT",
  DPAD_UP = "DPAD_UP",
  DPAD_DOWN = "DPAD_DOWN",
}

/** How a prompt for an Action should be drawn. */
export type PromptKind = "glyph" | "diagram";

/** Which part the ControllerDiagram should light up (for kind === "diagram"). */
export type DiagramPart =
  | "LB"
  | "RB"
  | "LT"
  | "RT"
  | "L3"
  | "R3"
  | "LSTICK"
  | "RSTICK"
  | "DPAD"
  | "DPAD_LEFT"
  | "DPAD_RIGHT"
  | "DPAD_UP"
  | "DPAD_DOWN";

export interface ActionVisual {
  /** "glyph": a face-button letter (an icon that happens to be a letter). */
  kind: PromptKind;
  /** For glyphs: the letter shown. It is shape-matched, not read. */
  glyph?: "A" | "B" | "X" | "Y";
  /** For diagrams: which pad part to highlight. */
  part?: DiagramPart;
  /**
   * Prompt color. Face buttons take their literal Xbox color; everything else
   * takes NEUTRAL_INPUT (no invented color → no false mapping). This is the ONLY
   * place a color is assigned to an action, and consumers cannot override it.
   */
  color: number;
  /** Sound cue id, bonded to the color so ears learn the mapping too. */
  sound: string;
}

/**
 * ACTION_VISUAL — the one map. Every prompt, color, and cue derives from here.
 * Note there is no way for a caller to pass a different color: the value is
 * fixed per Action at the source.
 */
export const ACTION_VISUAL: Record<Action, ActionVisual> = {
  [Action.JUMP]: { kind: "glyph", glyph: "A", color: XBOX_BUTTON.A, sound: "btnA" },
  [Action.CANCEL]: { kind: "glyph", glyph: "B", color: XBOX_BUTTON.B, sound: "btnB" },
  [Action.ALT]: { kind: "glyph", glyph: "X", color: XBOX_BUTTON.X, sound: "btnX" },
  [Action.EXTRA]: { kind: "glyph", glyph: "Y", color: XBOX_BUTTON.Y, sound: "btnY" },

  [Action.FIRE]: { kind: "diagram", part: "RT", color: NEUTRAL_INPUT, sound: "trigger" },
  [Action.BRACE]: { kind: "diagram", part: "LT", color: NEUTRAL_INPUT, sound: "brace" },
  [Action.BUMP_L]: { kind: "diagram", part: "LB", color: NEUTRAL_INPUT, sound: "bump" },
  [Action.BUMP_R]: { kind: "diagram", part: "RB", color: NEUTRAL_INPUT, sound: "bump" },

  [Action.DASH]: { kind: "diagram", part: "L3", color: NEUTRAL_INPUT, sound: "dash" },

  [Action.DPAD_LEFT]: { kind: "diagram", part: "DPAD_LEFT", color: NEUTRAL_INPUT, sound: "dpad" },
  [Action.DPAD_RIGHT]: { kind: "diagram", part: "DPAD_RIGHT", color: NEUTRAL_INPUT, sound: "dpad" },
  [Action.DPAD_UP]: { kind: "diagram", part: "DPAD_UP", color: NEUTRAL_INPUT, sound: "dpad" },
  [Action.DPAD_DOWN]: { kind: "diagram", part: "DPAD_DOWN", color: NEUTRAL_INPUT, sound: "dpad" },
};

/**
 * Standard Gamepad button indices → Action. This is the ONLY place raw indices
 * appear. Standard mapping: 0=A 1=B 2=X 3=Y 4=LB 5=RB 6=LT 7=RT 10=L3 11=R3,
 * dpad 12=up 13=down 14=left 15=right.
 */
export const BUTTON_TO_ACTION: Record<number, Action> = {
  0: Action.JUMP,
  1: Action.CANCEL,
  2: Action.ALT,
  3: Action.EXTRA,
  4: Action.BUMP_L,
  5: Action.BUMP_R,
  6: Action.BRACE,
  7: Action.FIRE,
  10: Action.DASH,
  11: Action.DASH, // either stick click sprints; only L3 is prompted
  12: Action.DPAD_UP,
  13: Action.DPAD_DOWN,
  14: Action.DPAD_LEFT,
  15: Action.DPAD_RIGHT,
};

/** All discrete actions, for iterating (e.g. edge detection). */
export const ALL_ACTIONS: Action[] = Object.values(Action);

/** Triggers are read as analog axes on some pads; expose their button indices. */
export const TRIGGER_BUTTON = { LT: 6, RT: 7 } as const;
