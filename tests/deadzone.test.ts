import { describe, it, expect } from "vitest";
import { applyRadialDeadzone } from "@/input/InputState";

/**
 * The radial deadzone is the five lines that decide whether Phase 2 feels smooth
 * or feels like the robot fighting a child's thumb. These tests pin the two
 * properties that matter: (1) it is RADIAL (a diagonal just past the deadzone is
 * live, not dead), and (2) magnitude rescales so control ramps from zero.
 */

const DZ = 0.2;
const SAT = 0.9;

describe("applyRadialDeadzone", () => {
  it("zeroes input inside the deadzone", () => {
    const r = applyRadialDeadzone(0.1, 0.1, DZ, SAT);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
  });

  it("returns a clean zero (never NaN) for a perfectly centered stick", () => {
    // Regression: with deadzone 0 (the keyboard path), a centered (0,0) input
    // must not divide by a zero magnitude and produce NaN.
    for (const dz of [0, DZ]) {
      const r = applyRadialDeadzone(0, 0, dz, SAT);
      expect(Number.isNaN(r.x)).toBe(false);
      expect(Number.isNaN(r.y)).toBe(false);
      expect(r.x).toBe(0);
      expect(r.y).toBe(0);
    }
  });

  it("keeps a diagonal live just past the deadzone (no sticky cross)", () => {
    // Pure per-axis deadzones would kill this: each axis (0.16) is below 0.2,
    // yet the vector magnitude (~0.226) is past the deadzone and must register.
    const r = applyRadialDeadzone(0.16, 0.16, DZ, SAT);
    expect(Math.hypot(r.x, r.y)).toBeGreaterThan(0);
    // Direction is preserved (still a 45° diagonal).
    expect(r.x).toBeCloseTo(r.y, 5);
  });

  it("outputs zero magnitude exactly at the deadzone edge", () => {
    const r = applyRadialDeadzone(DZ, 0, DZ, SAT);
    expect(Math.hypot(r.x, r.y)).toBeCloseTo(0, 5);
  });

  it("saturates to magnitude 1 at/above the saturation point", () => {
    const r = applyRadialDeadzone(SAT, 0, DZ, SAT);
    expect(Math.hypot(r.x, r.y)).toBeCloseTo(1, 5);
    const over = applyRadialDeadzone(1, 0, DZ, SAT);
    expect(Math.hypot(over.x, over.y)).toBeCloseTo(1, 5);
  });

  it("rescales magnitude linearly between deadzone and saturation", () => {
    // Halfway between DZ and SAT should give magnitude ~0.5.
    const mid = (DZ + SAT) / 2;
    const r = applyRadialDeadzone(mid, 0, DZ, SAT);
    expect(Math.hypot(r.x, r.y)).toBeCloseTo(0.5, 5);
  });

  it("preserves direction while rescaling magnitude", () => {
    const r = applyRadialDeadzone(0.6, 0.8, DZ, SAT); // 3-4-5 direction
    const mag = Math.hypot(r.x, r.y);
    expect(r.x / mag).toBeCloseTo(0.6, 5);
    expect(r.y / mag).toBeCloseTo(0.8, 5);
  });
});
