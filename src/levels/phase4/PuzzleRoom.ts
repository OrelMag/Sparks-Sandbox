/**
 * PuzzleRoom.ts — the contract every Phase 4 room implements.
 *
 * A room owns its pieces, its slice of the signal graph, and its solved state.
 * The scene just lays rooms out, feeds them a context each frame, and checks
 * `solved`. New puzzles are new files here — no engine changes (see CLAUDE.md).
 */

import type { Spark } from "@/entities/Spark";
import type { InputState } from "@/input/InputState";
import type { Services } from "@/core/Services";
import type { GhostHint } from "@/ui/GhostHint";
import type { SkillTier } from "@/core/SkillTier";

export interface RoomContext {
  spark: Spark;
  input: InputState;
  services: Services;
  dt: number;
  time: number;
}

export interface PuzzleRoom {
  readonly solved: boolean;
  readonly hints: GhostHint[];
  update(ctx: RoomContext): void;
}

export interface RoomConfig {
  scene: Phaser.Scene;
  spark: Spark;
  tier: SkillTier;
}
