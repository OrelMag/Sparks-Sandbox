/**
 * Services.ts — the shared service container.
 *
 * Bundles the input spine and cross-scene state into one object, created once in
 * main.ts and stored in the Phaser registry. Scenes fetch it via
 * `getServices(this)` in create(), so no scene constructs input plumbing itself.
 *
 * `input.update()` is pumped once per frame by whichever scene is active
 * (PhaseScene does this in its base update), so justPressed edge detection works
 * globally.
 */

import Phaser from "phaser";
import { GamepadService } from "@/input/GamepadService";
import { KeyboardFallback } from "@/input/KeyboardFallback";
import { InputState } from "@/input/InputState";
import { Rumble } from "@/input/Rumble";
import { SkillTracker } from "./SkillTracker";
import { SaveState } from "./SaveState";
import { ButtonAudio } from "@/audio/ButtonAudio";

const REGISTRY_KEY = "spark.services";

export interface Services {
  pad: GamepadService;
  keys: KeyboardFallback;
  input: InputState;
  rumble: Rumble;
  skills: SkillTracker;
  save: SaveState;
  audio: ButtonAudio;
}

export function createServices(): Services {
  const pad = new GamepadService();
  const keys = new KeyboardFallback();
  keys.attach();
  const input = new InputState(pad, keys);
  const rumble = new Rumble(pad);
  const skills = new SkillTracker();
  const save = new SaveState();
  const audio = new ButtonAudio();
  return { pad, keys, input, rumble, skills, save, audio };
}

export function registerServices(game: Phaser.Game, services: Services): void {
  game.registry.set(REGISTRY_KEY, services);
}

export function getServices(scene: Phaser.Scene): Services {
  const s = scene.game.registry.get(REGISTRY_KEY) as Services | undefined;
  if (!s) throw new Error("Services not registered — did main.ts run createServices()?");
  return s;
}
