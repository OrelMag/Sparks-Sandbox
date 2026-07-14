/**
 * Interactable.ts — the base for everything the player acts on.
 *
 * One abstraction backs both Phase 1 toys (press A → spring) and Phase 4 switches
 * (hold LB → power). An Interactable owns: a color-matched Prompt (built from its
 * Action, so its color is never chosen by hand), a GhostHint for wordless
 * teaching, and a "discovered" flag that quiets the hint once learned.
 *
 * Subclasses implement two things: `respond()` — the effect — and how they detect
 * their trigger, via `isTriggered(ctx)`. The base handles feedback (prompt
 * depress, audio cue, rumble, discovery) so every prop feels consistent.
 */

import Phaser from "phaser";
import { Action, ACTION_VISUAL } from "@/input/Action";
import { createPrompt, Prompt } from "@/ui/Prompt";
import { GhostHint } from "@/ui/GhostHint";
import type { Spark } from "@/entities/Spark";
import type { Services } from "@/core/Services";

export interface InteractContext {
  spark?: Spark;
  services: Services;
  dt: number;
}

/**
 * The surface the scene's loop needs from any prop: something to update, a
 * wordless hint to escalate, and a discovered flag. Interactable implements it;
 * so does the multi-direction DPadToy, which can't be a single-Action
 * Interactable. This is what lets both live in one InteractableManager.
 */
export interface ManagedProp {
  update(ctx: InteractContext): void;
  readonly hint: GhostHint;
  readonly discovered: boolean;
  destroy(): void;
}

export interface InteractableConfig {
  scene: Phaser.Scene;
  action: Action;
  x: number;
  y: number;
  /** Prompt offset from the prop (default: floating above). */
  promptDx?: number;
  promptDy?: number;
}

export abstract class Interactable implements ManagedProp {
  readonly action: Action;
  protected scene: Phaser.Scene;
  readonly x: number;
  readonly y: number;
  protected prompt: Prompt;
  readonly hint: GhostHint;

  private _discovered = false;
  private wasActive = false;
  private lastServices?: Services;

  constructor(cfg: InteractableConfig) {
    this.scene = cfg.scene;
    this.action = cfg.action;
    this.x = cfg.x;
    this.y = cfg.y;

    this.prompt = createPrompt(cfg.scene, cfg.action);
    this.prompt.setPosition(cfg.x + (cfg.promptDx ?? 0), cfg.y + (cfg.promptDy ?? -70));

    this.hint = new GhostHint({
      onPulse: () => this.prompt.pulse(),
      onStopPulse: () => this.prompt.stopPulse(),
      onGhost: () => this.demo(),
      isDone: () => this._discovered,
    });
  }

  get discovered(): boolean {
    return this._discovered;
  }

  /** Called every frame by the manager. */
  update(ctx: InteractContext): void {
    this.lastServices = ctx.services;
    const active = this.isTriggered(ctx);

    // Fire on the rising edge for press-style props; hold-style props override
    // update() entirely if they need continuous behavior.
    if (active && !this.wasActive) {
      this.activate(ctx);
    }
    this.wasActive = active;

    this.onFrame(ctx, active);
  }

  /** The rising-edge activation: feedback + effect + discovery. */
  protected activate(ctx: InteractContext): void {
    const visual = ACTION_VISUAL[this.action];
    this.prompt.depress();
    ctx.services.audio.play(visual.sound);
    ctx.services.rumble.tap();
    this.respond(ctx, false);
    this.markDiscovered();
  }

  /** Mark learned and gently retire the prompt so it stops competing for attention. */
  protected markDiscovered(): void {
    if (this._discovered) return;
    this._discovered = true;
    this.prompt.stopPulse();
    this.scene.tweens.add({
      targets: this.prompt.container,
      alpha: 0.4,
      scale: 0.8,
      duration: 400,
      ease: "Quad.out",
    });
  }

  /**
   * The wordless demo. Default: depress the prompt and perform the effect at
   * "ghost" intensity so the child sees what would happen. Props with a Spark
   * reaction override to also animate a ghost Spark. Runs only once services are
   * known (after the first update frame), so it never fires on a cold scene.
   */
  protected demo(): void {
    if (!this.lastServices) return;
    this.prompt.depress();
    this.respond({ services: this.lastServices, dt: 0 }, true);
  }

  /** True while the trigger is engaged this frame. */
  protected abstract isTriggered(ctx: InteractContext): boolean;

  /**
   * The prop's effect. `ghost` is true when this is a demonstration, so the prop
   * can render it faintly / without side effects (no score changes, no sound).
   */
  protected abstract respond(ctx: InteractContext, ghost: boolean): void;

  /** Optional continuous per-frame hook (e.g. keep a fan spinning). */
  protected onFrame(_ctx: InteractContext, _active: boolean): void {}

  destroy(): void {
    this.prompt.destroy();
  }
}
