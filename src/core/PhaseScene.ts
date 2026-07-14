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
import { ALL_ACTIONS } from "@/input/Action";
import { COLOR } from "@/config/Palette";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/GameConfig";
import { TUNING } from "@/config/Tuning";

export abstract class PhaseScene extends Phaser.Scene {
  protected services!: Services;
  protected spark?: Spark;
  protected idle = 0;
  protected props = new InteractableManager();

  private hints: GhostHint[] = [];
  private lastTime = 0;

  /** World rectangle Spark is soft-clamped inside. Phases may shrink it. */
  protected worldBounds = new Phaser.Geom.Rectangle(40, 40, GAME_WIDTH - 80, GAME_HEIGHT - 80);

  create(): void {
    this.services = getServices(this);
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

    const { input, skills, save } = this.services;
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

    void save; // reserved for phase-open persistence in subclasses
    this.onUpdate(dt);
  }

  /** Register a hint so the base loop escalates it while idle. */
  protected registerHint(hint: GhostHint): void {
    this.hints.push(hint);
  }

  /**
   * Fade back to the hub after a beat. Phases call this once complete so the
   * child is returned to the playground to pick the next door — never a "you
   * win" screen, just a gentle trip home.
   */
  protected goToHub(delayMs = 2200): void {
    this.time.delayedCall(delayMs, () => {
      this.cameras.main.fadeOut(400, 15, 16, 32);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("Hub");
      });
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
