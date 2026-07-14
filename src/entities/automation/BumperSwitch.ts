/**
 * BumperSwitch.ts — a Source reflecting whether a bumper is held.
 *
 * Room 3 has two of these, one for LB and one for RB. Each shows a controller
 * diagram of its bumper and a lever that throws when that bumper is down. Feeding
 * both into an AndGate makes the "both at once" requirement (skill 8) visible: a
 * single thrown switch lights its own wire but the gate stays dark until the
 * second joins it in the same frame.
 */

import Phaser from "phaser";
import { COLOR, NEUTRAL_INPUT_LIT } from "@/config/Palette";
import { Source } from "@/systems/logic/SignalGraph";
import { ControllerDiagram } from "@/ui/ControllerDiagram";
import type { DiagramPart } from "@/input/Action";

export class BumperSwitch {
  readonly source = new Source(false);
  private lever: Phaser.GameObjects.Rectangle;
  private diagram: ControllerDiagram;

  constructor(scene: Phaser.Scene, x: number, y: number, part: "LB" | "RB") {
    scene.add.rectangle(x, y, 46, 60, COLOR.metalDark).setStrokeStyle(3, 0x2a2f4a).setDepth(7);
    this.lever = scene.add.rectangle(x, y - 12, 12, 40, COLOR.wireOff).setOrigin(0.5, 1).setDepth(8);

    this.diagram = new ControllerDiagram(scene, part as DiagramPart);
    this.diagram.setPosition(x, y - 90);
  }

  get prompt(): ControllerDiagram {
    return this.diagram;
  }

  set(down: boolean): void {
    this.source.set(down);
    // Throw the lever and light it.
    this.lever.setAngle(down ? 35 : 0);
    this.lever.setFillStyle(down ? NEUTRAL_INPUT_LIT : COLOR.wireOff);
  }
}
