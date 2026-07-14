/**
 * main.ts — bootstrap.
 *
 * Creates the shared Services (input spine) and registers them, then a tiny Boot
 * scene (scene index 0, the one Phaser force-starts) launches Observation Mode as
 * a parallel overlay and starts the requested scene. Routing everything through
 * Boot is what stops a stray scene (e.g. the dev input debugger) from
 * auto-starting alongside the game and double-pumping input each frame.
 *
 * Scene selection honors ?scene=<key> for dev jumps (?scene=phase3, ?scene=debug).
 */

import Phaser from "phaser";
import { baseGameConfig } from "@/config/GameConfig";
import { createServices, registerServices } from "@/core/Services";
import { DebugInputScene } from "@/scenes/DebugInputScene";
import { HubScene } from "@/scenes/HubScene";
import { Phase1_BusyBox } from "@/scenes/Phase1_BusyBox";
import { Phase2_GearPen } from "@/scenes/Phase2_GearPen";
import { Phase3_DualStick } from "@/scenes/Phase3_DualStick";
import { Phase4_AutomationGates } from "@/scenes/Phase4_AutomationGates";
import { DebugOverlay } from "@/ui/DebugOverlay";

/** Maps ?scene= values to scene keys. Extended as phases land. */
const SCENE_ALIASES: Record<string, string> = {
  debug: "debug",
  hub: "Hub",
  phase1: "P1_BusyBox",
  phase2: "P2_GearPen",
  phase2a: "P2_GearPen",
  phase2b: "P2_GearPen",
  phase3: "P3_DualStick",
  phase4: "P4_AutomationGates",
};

function requestedSceneKey(): string {
  const params = new URLSearchParams(window.location.search);
  const req = params.get("scene");
  if (req && SCENE_ALIASES[req]) return SCENE_ALIASES[req];
  return "Hub";
}

/** Boot: the only auto-started scene. Wires up the overlay and the entry scene. */
class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  create(): void {
    this.scene.launch("ObservationMode"); // parallel overlay, hidden until toggled
    this.scene.start(requestedSceneKey()); // replaces Boot with the entry scene
  }
}

// Boot must be first so it is the scene Phaser auto-starts. ObservationMode last
// so it renders on top of the active phase.
const scenes: Phaser.Types.Scenes.SceneType[] = [
  BootScene,
  HubScene,
  Phase1_BusyBox,
  Phase2_GearPen,
  Phase3_DualStick,
  Phase4_AutomationGates,
  DebugInputScene,
  DebugOverlay,
];

const game = new Phaser.Game(baseGameConfig("game", scenes));

const services = createServices();
registerServices(game, services);

// Dev-only handle for headless verification (see scripts/smoke.mjs).
(window as unknown as { __game?: Phaser.Game }).__game = game;
