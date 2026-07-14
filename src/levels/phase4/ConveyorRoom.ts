/**
 * ConveyorRoom.ts — Room 2: brace (LT) and press A to run the belt.
 *
 * Skill 7 exercised: the hold-and-press chord. The belt's Latch only toggles on
 * an A press WHILE LT is held, so a bare A does nothing — the two fingers must
 * cooperate. Graph:
 *   Source(chord) → Latch(toggle) → ConveyorBelt(sink).
 * Solved when the belt has carried its block to the socket.
 */

import { ConveyorBelt } from "@/entities/automation/ConveyorBelt";
import { Wire } from "@/entities/automation/Wire";
import { Source, Latch, SignalGraph } from "@/systems/logic/SignalGraph";
import { GhostHint } from "@/ui/GhostHint";
import { ControllerDiagram } from "@/ui/ControllerDiagram";
import { createPrompt, Prompt } from "@/ui/Prompt";
import { Action } from "@/input/Action";
import type { PuzzleRoom, RoomConfig, RoomContext } from "./PuzzleRoom";

export class ConveyorRoom implements PuzzleRoom {
  readonly hints: GhostHint[] = [];
  private belt: ConveyorBelt;
  private chord = new Source(false);
  private latch: Latch;
  private graph = new SignalGraph();
  private wire: Wire;
  private bracePrompt: ControllerDiagram;
  private pressPrompt: Prompt;
  private prevChord = false;

  constructor(cfg: RoomConfig, x: number, y: number) {
    const s = cfg.scene;
    this.latch = this.graph.track(new Latch(this.chord));
    this.belt = new ConveyorBelt(s, x, x + 300, y, this.latch);
    this.wire = new Wire(
      s,
      [
        [x - 40, y],
        [x - 40, y - 60],
        [x + 150, y - 60],
      ],
      this.latch
    );

    // Two prompts side by side: the chord is "hold LT" + "press A".
    this.bracePrompt = new ControllerDiagram(s, "LT");
    this.bracePrompt.setPosition(x - 120, y - 40);
    this.pressPrompt = createPrompt(s, Action.JUMP); // A / green
    this.pressPrompt.setPosition(x - 60, y - 40);

    this.hints.push(
      new GhostHint({
        onPulse: () => {
          this.bracePrompt.pulse();
          this.pressPrompt.pulse();
        },
        onStopPulse: () => {
          this.bracePrompt.stopPulse();
          this.pressPrompt.stopPulse();
        },
        onGhost: () => {
          this.bracePrompt.depress();
          this.pressPrompt.depress();
        },
        isDone: () => this.belt.isDelivered,
      })
    );
  }

  update(ctx: RoomContext): void {
    const braced = ctx.input.isDown(Action.BRACE);
    const pressA = ctx.input.isDown(Action.JUMP);
    // The chord: A only counts while LT is held.
    this.chord.set(braced && pressA);

    // Feedback on the toggle edge.
    const nowChord = this.chord.isPowered();
    if (nowChord && !this.prevChord) {
      ctx.services.audio.play("btnA");
      ctx.services.rumble.tap(0.5, 90);
    }
    this.prevChord = nowChord;

    this.graph.step();
    this.belt.update(ctx.dt);
    this.wire.update(ctx.time);

    if (this.belt.isDelivered && !this._justSolved) {
      this._justSolved = true;
      ctx.services.audio.play("powerOn");
    }
  }

  private _justSolved = false;

  get solved(): boolean {
    return this.belt.isDelivered;
  }
}
