/**
 * Prompt.ts — the shared prompt surface + factory.
 *
 * A Prompt is the on-screen "press this" hint floating above a prop. There are
 * exactly two implementations — ButtonPrompt (a colored face-button glyph) and
 * ControllerDiagram (a pad silhouette with one part lit) — and the factory picks
 * between them based purely on the Action's ACTION_VISUAL.kind. Gameplay code
 * asks for `createPrompt(scene, action)` and never chooses a color or a glyph
 * itself: that's what keeps golden rule 2 structural.
 */

import Phaser from "phaser";
import { Action, ACTION_VISUAL } from "@/input/Action";

export interface Prompt {
  readonly container: Phaser.GameObjects.Container;
  setPosition(x: number, y: number): this;
  setScale(s: number): this;
  setVisible(v: boolean): this;
  /** Start the "look here" attention pulse (idle escalation step 1). */
  pulse(): void;
  /** Stop pulsing and settle. */
  stopPulse(): void;
  /** One-shot "the button is being pressed" animation (ghost demo). */
  depress(): void;
  destroy(): void;
}

/** Build the correct Prompt for an action. The ONLY way prompts are created. */
export function createPrompt(scene: Phaser.Scene, action: Action): Prompt {
  const visual = ACTION_VISUAL[action];
  if (visual.kind === "glyph") {
    return new ButtonPrompt(scene, action);
  }
  if (!visual.part) {
    throw new Error(`Diagram action ${action} has no part in ACTION_VISUAL`);
  }
  return new ControllerDiagram(scene, visual.part);
}

// Imported after the interface so the factory above can reference them.
import { ButtonPrompt } from "./ButtonPrompt";
import { ControllerDiagram } from "./ControllerDiagram";
