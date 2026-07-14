/**
 * PhaseScene.ts — the base every phase extends.
 *
 * Centralizes the machinery each phase needs so levels stay thin:
 *   - pumps input.update() once per frame (global edge detection),
 *   - runs the shared idle clock and ticks every registered GhostHint,
 *   - feeds the SkillTracker (discovered actions, stick samples),
 *   - soft-clamps Spark to the world edge — the zero-failure guarantee lives
 *     here, so no phase can let him fall or leave the world,
 *   - resumes audio on first input,
 *   - spawns ghost-Spark copies for wordless demos.
 *
 * Subclasses implement buildPhase() to lay out props and create Spark, and may
 * override onUpdate(dt) for phase logic.
 */

import Phaser from "phaser";
import { getServices, Services } from "./Services";
import { GhostHint } from "@/ui/GhostHint";
import { InteractableManager } from "@/systems/InteractableManager";
import type { ManagedProp } from "@/systems/Interactable";
import { Spark } from "@/entities/Spark";
import { Portal, type PortalIcon } from "@/entities/Portal";
import { ALL_ACTIONS, Action } from "@/input/Action";
import { createPrompt, type Prompt } from "@/ui/Prompt";
import { COLOR } from "@/config/Palette";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/GameConfig";
import { TUNING } from "@/config/Tuning";

export abstract class PhaseScene extends Phaser.Scene {
  protected services!: Services;
  protected spark?: Spark;
  protected idle = 0;
  protected props = new InteractableManager();
  protected transitioning = false;

  private hints: GhostHint[] = [];
  private lastTime = 0;
  private levelExit?: { portal: Portal; prompt: Prompt; destination: string };
  private exitPosition?: { x: number; y: number };
  private exitHold?: Phaser.Time.TimerEvent;
  private exitReady = false;

  /** World rectangle Spark is soft-clamped inside. Phases may shrink it. */
  protected worldBounds = new Phaser.Geom.Rectangle(40, 40, GAME_WIDTH - 80, GAME_HEIGHT - 80);

  create(): void {
    this.services = getServices(this);
    this.idle = 0;
    this.props = new InteractableManager();
    this.transitioning = false;
    this.hints = [];
    this.lastTime = 0;
    this.levelExit = undefined;
    this.exitPosition = undefined;
    this.exitHold = undefined;
    this.exitReady = false;
    this.drawBackground();
    this.buildPhase();
  }

  /** Lay out props and create Spark. */
  protected abstract buildPhase(): void;

  /** Optional per-frame phase logic. */
  protected onUpdate(_dt: number): void {}

  update(time: number): void {
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0;
    this.lastTime = time;

    const { input, skills } = this.services;
    input.update();

    // Idle clock: any button, or a meaningfully deflected stick, counts as
    // activity and resets the wordless-hint escalation.
    const active = this.hadInput();
    if (active) {
      this.idle = 0;
      this.services.audio.resume();
      for (const h of this.hints) h.reset();
    } else {
      this.idle += dt;
      for (const h of this.hints) h.tick(this.idle);
    }

    // Feed the pedagogical instrument.
    for (const a of ALL_ACTIONS) {
      if (input.justPressed(a)) skills.markAction(a);
    }
    skills.sampleSticks(
      Math.hypot(input.move.x, input.move.y),
      Math.hypot(input.aim.x, input.aim.y)
    );

    // Move + soft-clamp Spark.
    if (this.spark) {
      this.spark.update(input, dt);
      this.softClamp(this.spark);
    }

    // Update interactables (props/switches).
    this.props.update({ spark: this.spark, services: this.services, dt });

    this.onUpdate(dt);
    this.updateLevelExit();
  }

  /** Register a hint so the base loop escalates it while idle. */
  protected registerHint(hint: GhostHint): void {
    this.hints.push(hint);
  }

  /** Place the always-available wordless door back to the hub. */
  protected placeLevelExit(x: number, y: number): void {
    this.exitPosition = { x, y };
    this.setLevelExit("Hub", "home", false);
  }

  /** Replace the hub exit with the door to the next curriculum phase. */
  protected unlockNextExit(destination: string, icon: PortalIcon): void {
    this.setLevelExit(destination, icon, true);
  }

  /** Shared wordless transition for hub portals and level exits. */
  protected transitionTo(sceneKey: string): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cancelExitHold();
    this.services.audio.play("open");
    this.spark?.pop(0.8);
    this.cameras.main.fadeOut(350, 15, 16, 32);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey);
    });
  }

  /**
   * Add an interactable: it will be updated each frame and its wordless hint
   * wired into the idle clock. The one call a phase needs to place a prop.
   */
  protected addInteractable<T extends ManagedProp>(item: T): T {
    this.props.add(item);
    this.registerHint(item.hint);
    return item;
  }

  /** True if the player did anything this frame. */
  private hadInput(): boolean {
    const { input } = this.services;
    if (Math.hypot(input.move.x, input.move.y) > 0.15) return true;
    if (Math.hypot(input.aim.x, input.aim.y) > 0.15) return true;
    return ALL_ACTIONS.some((a) => input.isDown(a));
  }

  /**
   * The zero-failure guarantee. Instead of walls or death, gently push Spark
   * back inside the world. He can lean on the edge forever; he can never leave.
   */
  private softClamp(spark: Spark): void {
    const b = this.worldBounds;
    const push = TUNING.softClampPush;
    let { x, y } = spark;
    if (x < b.x) x += push;
    else if (x > b.right) x -= push;
    if (y < b.y) y += push;
    else if (y > b.bottom) y -= push;
    if (x !== spark.x || y !== spark.y) spark.setPosition(x, y);
  }

  /**
   * A faint, non-interactive copy of Spark for a ghost demo. The caller tweens
   * it to show an action, then calls the returned dispose() (or lets it auto-
   * fade). Never collides, never persists.
   */
  protected spawnGhostSpark(x: number, y: number): {
    container: Phaser.GameObjects.Container;
    dispose: () => void;
  } {
    const { container } = Spark.buildBody(this, 1, 0.35);
    container.setPosition(x, y).setDepth(18);
    const dispose = () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 300,
        onComplete: () => container.destroy(),
      });
    };
    return { container, dispose };
  }

  private setLevelExit(destination: string, icon: PortalIcon, drawAttention: boolean): void {
    if (!this.exitPosition) return;
    this.cancelExitHold();
    this.levelExit?.portal.destroy();
    if (this.levelExit) this.tweens.killTweensOf(this.levelExit.prompt.container);
    this.levelExit?.prompt.destroy();

    const { x, y } = this.exitPosition;
    const portal = new Portal(this, x, y, icon, destination);
    const prompt = createPrompt(this, Action.JUMP).setPosition(x, y - 112).setScale(0.75);
    if (drawAttention) prompt.pulse();
    this.levelExit = { portal, prompt, destination };
  }

  private updateLevelExit(): void {
    if (!this.spark || !this.levelExit || this.transitioning) return;
    const active =
      this.levelExit.portal.contains(this.spark.x, this.spark.y) &&
      this.services.input.isDown(Action.JUMP);

    if (!active) {
      this.cancelExitHold();
      return;
    }
    if (this.exitReady) {
      this.transitionTo(this.levelExit.destination);
      return;
    }
    if (this.exitHold) return;

    this.levelExit.prompt.depress();
    this.services.rumble.hold(TUNING.exitHoldMs);
    this.exitHold = this.time.delayedCall(TUNING.exitHoldMs, () => (this.exitReady = true));
  }

  private cancelExitHold(): void {
    this.exitHold?.remove(false);
    this.exitHold = undefined;
    this.exitReady = false;
  }

  private drawBackground(): void {
    // Vertical gradient via two stacked rectangles + soft vignette dots.
    this.cameras.main.setBackgroundColor(COLOR.bgBottom);
    const g = this.add.graphics().setDepth(-100);
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(COLOR.bgTop),
        Phaser.Display.Color.ValueToColor(COLOR.bgBottom),
        steps - 1,
        i
      );
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      g.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
      void t;
    }
  }
}
