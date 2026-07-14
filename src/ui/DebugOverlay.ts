/**
 * DebugOverlay.ts — Observation Mode (parent-facing, dev-only).
 *
 * The ONE place words are allowed (see CLAUDE.md + the guard allowlist): this is
 * for the parent, never the child. It runs as a parallel scene on top of
 * whatever phase is active and is hidden until toggled with the backtick key (`)
 * — a key a 7-year-old won't stumble onto. It reads the SkillTracker so you can
 * see whether the toy is actually teaching:
 *   - which inputs he has discovered,
 *   - average stick precision,
 *   - the Phase-3 independence ratio (both sticks at once) — the number that
 *     says whether the hardest skill landed.
 *
 * A pedagogical goal you can't measure is a wish. This is the measurement. It is
 * stripped from production builds and is never shown to the player.
 */

import Phaser from "phaser";
import { getServices, Services } from "@/core/Services";
import { CURRICULUM } from "@/config/Curriculum";

const ALL_INPUT_IDS = [
  "JUMP", "CANCEL", "ALT", "EXTRA",
  "DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT",
  "LSTICK", "RSTICK", "DASH",
  "FIRE", "BRACE", "BUMP_L", "BUMP_R",
];

export class DebugOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "ObservationMode", active: false });
  }

  private services!: Services;
  private panel!: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Text;
  private shown = false;

  create(): void {
    this.services = getServices(this);

    const bg = this.add.rectangle(0, 0, 460, 520, 0x0a0c1a, 0.9).setOrigin(0, 0).setStrokeStyle(2, 0x6fe3ff);
    const title = this.add.text(16, 12, "OBSERVATION MODE  (parent) — press ` to hide", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#6fe3ff",
    });
    this.body = this.add.text(16, 44, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#e8ecff",
      lineSpacing: 4,
    });
    this.panel = this.add.container(20, 20, [bg, title, this.body]).setDepth(1000).setVisible(false);

    // Toggle on backtick via a direct window listener — reliable regardless of
    // which scene holds Phaser's keyboard focus. Cleaned up on shutdown.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.code === "Backquote") this.toggle();
    };
    window.addEventListener("keydown", onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", onKey);
    });
  }

  private toggle(): void {
    this.shown = !this.shown;
    this.panel.setVisible(this.shown);
  }

  update(): void {
    if (!this.shown) return;
    const rep = this.services.skills.report();
    const tier = this.services.save.tier;

    const discovered = ALL_INPUT_IDS.map(
      (id) => `${rep.discovered.has(id) ? "✓" : "·"} ${id}`
    );

    const skillRows = CURRICULUM.map((step) => {
      const got = step.introduces.every(
        (i) => rep.discovered.has(i) || rep.discovered.has(i.replace("_X", ""))
      );
      return `  ${got ? "✓" : "·"} ${step.id}. ${step.skill}`;
    });

    this.body.setText(
      [
        `tier: ${tier}`,
        `stick precision: ${(rep.avgStickPrecision * 100).toFixed(0)}%`,
        `independence ratio: ${(rep.independenceRatio * 100).toFixed(0)}%  (skill 5)`,
        `active frames: ${rep.totalActiveFrames}`,
        "",
        "inputs discovered:",
        ...chunk(discovered, 2).map((r) => "  " + r.join("   ")),
        "",
        "curriculum:",
        ...skillRows,
      ].join("\n")
    );
  }
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
