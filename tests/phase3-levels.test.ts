import { describe, it, expect } from "vitest";
import { LEVELS } from "@/config/Phase3Levels";

/**
 * Phase3_DualStick chains three arenas by hand-written scene-key strings
 * (`key` / `nextScene`), and TypeScript types both as plain `string` — a typo
 * like "P3_MovingTarget" would compile cleanly and only surface as a level
 * exit that silently opens the wrong door (or nothing at runtime a smoke test
 * would reliably catch, since it depends on precise gameplay to trigger). This
 * is exactly the class of bug CLAUDE.md calls out as invisible to tsc; a cheap
 * data test on the chain itself is the reliable way to pin it.
 */
describe("Phase3_DualStick LEVELS chain", () => {
  it("has at least one level and no duplicate keys", () => {
    expect(LEVELS.length).toBeGreaterThan(0);
    const keys = LEVELS.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("chains each level's nextScene to the next level's key, ending at Phase 4", () => {
    for (let i = 0; i < LEVELS.length - 1; i++) {
      expect(LEVELS[i].nextScene).toBe(LEVELS[i + 1].key);
    }
    expect(LEVELS[LEVELS.length - 1].nextScene).toBe("P4_AutomationGates");
  });

  it("gives every level at least one target to wash", () => {
    for (const level of LEVELS) {
      expect(level.targets.length).toBeGreaterThan(0);
    }
  });

  it("only marks a target as moving when it has a real destination and duration", () => {
    for (const level of LEVELS) {
      for (const [, , toX, toY, duration] of level.targets) {
        const hasDestination = toX !== undefined && toY !== undefined;
        const hasDuration = duration !== undefined && duration > 0;
        // Either fully static (no motion fields) or fully specified — never
        // half-specified, which would silently draw a track with no tween or
        // vice versa (the bug the merged build loop in Phase3_DualStick now
        // makes structurally impossible, but the data shape should agree).
        expect(hasDestination).toBe(hasDuration);
      }
    }
  });
});
