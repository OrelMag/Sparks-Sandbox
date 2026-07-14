import { describe, it, expect } from "vitest";
import { SaveState } from "@/core/SaveState";
import { SkillTier } from "@/core/SkillTier";

/**
 * A minimal in-memory Storage so we can round-trip without a browser. SaveState
 * accepts an injected Storage precisely so this is testable and so it degrades
 * gracefully when localStorage is unavailable.
 */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
  } as Storage;
}

describe("SaveState", () => {
  it("round-trips opened phases and tier through storage", () => {
    const storage = memoryStorage();

    const a = new SaveState(storage);
    expect(a.tier).toBe(SkillTier.SIMPLE); // default
    a.setTier(SkillTier.LOGIC);
    a.openPhase("P1_BusyBox");
    a.openPhase("P3_DualStick");

    // A fresh instance backed by the same storage sees the persisted state.
    const b = new SaveState(storage);
    expect(b.tier).toBe(SkillTier.LOGIC);
    expect(b.isOpened("P1_BusyBox")).toBe(true);
    expect(b.isOpened("P3_DualStick")).toBe(true);
    expect(b.isOpened("P2_GearPen")).toBe(false);
  });

  it("does not duplicate an already-opened phase", () => {
    const storage = memoryStorage();
    const s = new SaveState(storage);
    s.openPhase("P1_BusyBox");
    s.openPhase("P1_BusyBox");
    expect(s.snapshot().openedPhases).toEqual(["P1_BusyBox"]);
  });

  it("degrades to in-memory when storage is unavailable (null)", () => {
    const s = new SaveState(null);
    expect(() => {
      s.setTier(SkillTier.LOGIC);
      s.openPhase("P1_BusyBox");
    }).not.toThrow();
    expect(s.tier).toBe(SkillTier.LOGIC);
    expect(s.isOpened("P1_BusyBox")).toBe(true);
  });
});
