/**
 * BridgeRoom.ts — Room 3: hold BOTH bumpers to extend the bridge.
 *
 * Skill 8 exercised: the simultaneous symmetric chord. Graph:
 *   Source(LB), Source(RB) → AndGate → Bridge(sink), each source on its own Wire.
 * Because the AND gate reads both inputs in one evaluation, "at the same time"
 * is inherent — one bumper lights only its own wire; the bridge stays retracted
 * until the second joins it. Solved once the bridge extends.
 */

import { BumperSwitch } from "@/entities/automation/BumperSwitch";
import { Bridge } from "@/entities/automation/Bridge";
import { Wire } from "@/entities/automation/Wire";
import { AndGate } from "@/systems/logic/SignalGraph";
import { GhostHint } from "@/ui/GhostHint";
import { Action } from "@/input/Action";
import { SkillTier } from "@/core/SkillTier";
import { COLOR } from "@/config/Palette";
import type { PuzzleRoom, RoomConfig, RoomContext } from "./PuzzleRoom";

export class BridgeRoom implements PuzzleRoom {
  readonly hints: GhostHint[] = [];
  private lb: BumperSwitch;
  private rb: BumperSwitch;
  private gate: AndGate;
  private bridge: Bridge;
  private wires: Wire[] = [];
  private _solved = false;

  constructor(cfg: RoomConfig, x: number, y: number) {
    const s = cfg.scene;
    this.lb = new BumperSwitch(s, x, y, "LB");
    this.rb = new BumperSwitch(s, x + 120, y, "RB");
    this.gate = new AndGate([this.lb.source, this.rb.source]);

    // The gate feeds the bridge over a gap to the right.
    this.bridge = new Bridge(s, x + 260, x + 560, y, this.gate);

    this.wires.push(
      new Wire(s, [[x, y + 30], [x, y + 70], [x + 230, y + 70]], this.lb.source),
      new Wire(s, [[x + 120, y + 30], [x + 120, y + 90], [x + 230, y + 90]], this.rb.source),
      new Wire(s, [[x + 240, y + 80], [x + 260, y + 80], [x + 260, y]], this.gate)
    );

    // In LOGIC tier, expose an AND-gate symbol so an older player sees the logic.
    if (cfg.tier === SkillTier.LOGIC) {
      s.add.circle(x + 240, y + 80, 22, COLOR.metalDark).setStrokeStyle(3, COLOR.wireOn).setDepth(6);
      // A crude "&" drawn with an arc + tail.
      const g = s.add.graphics().setDepth(7);
      g.lineStyle(3, COLOR.wireOn, 1);
      g.strokeCircle(x + 240, y + 74, 7);
      g.beginPath();
      g.moveTo(x + 236, y + 80);
      g.lineTo(x + 248, y + 90);
      g.strokePath();
    }

    this.hints.push(
      new GhostHint({
        onPulse: () => {
          this.lb.prompt.pulse();
          this.rb.prompt.pulse();
        },
        onStopPulse: () => {
          this.lb.prompt.stopPulse();
          this.rb.prompt.stopPulse();
        },
        onGhost: () => {
          this.lb.prompt.depress();
          this.rb.prompt.depress();
        },
        isDone: () => this._solved,
      })
    );

    s.physics.add.collider(cfg.spark.container, this.bridge.collider);
  }

  update(ctx: RoomContext): void {
    this.lb.set(ctx.input.isDown(Action.BUMP_L));
    this.rb.set(ctx.input.isDown(Action.BUMP_R));
    this.bridge.update();
    for (const w of this.wires) w.update(ctx.time);

    if (this.bridge.isExtended && !this._solved) {
      this._solved = true;
      ctx.services.audio.play("powerOn");
      ctx.services.rumble.tap(0.6, 140);
    }
  }

  get solved(): boolean {
    return this._solved;
  }
}
