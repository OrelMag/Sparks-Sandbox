import { describe, it, expect } from "vitest";
import { SkillTracker } from "@/core/SkillTracker";
import { Action } from "@/input/Action";

/**
 * SkillTracker feeds Observation Mode's independence ratio — "the single number
 * that says whether skill 5 landed" per CLAUDE.md. It has no failure mode to
 * crash on if the math is wrong; it would just silently misreport whether the
 * hardest skill in the curriculum is actually teaching. Pinned here.
 */
describe("SkillTracker", () => {
  it("starts with nothing discovered and a zeroed report", () => {
    const t = new SkillTracker();
    const rep = t.report();
    expect(rep.discovered.size).toBe(0);
    expect(rep.avgStickPrecision).toBe(0);
    expect(rep.independenceRatio).toBe(0);
    expect(rep.totalActiveFrames).toBe(0);
  });

  it("markAction/markInput feed the discovered set", () => {
    const t = new SkillTracker();
    t.markAction(Action.JUMP);
    t.markInput("LSTICK");
    expect(t.has(Action.JUMP)).toBe(true);
    expect(t.has("LSTICK")).toBe(true);
    expect(t.has("RSTICK")).toBe(false);
  });

  it("ignores stick magnitudes below the noise floor", () => {
    const t = new SkillTracker();
    t.sampleSticks(0.03, 0.02);
    expect(t.has("LSTICK")).toBe(false);
    expect(t.has("RSTICK")).toBe(false);
    expect(t.report().totalActiveFrames).toBe(0);
  });

  it("moving alone discovers LSTICK but never RSTICK, and independence stays zero", () => {
    const t = new SkillTracker();
    t.sampleSticks(0.5, 0);
    t.sampleSticks(1.0, 0);
    expect(t.has("LSTICK")).toBe(true);
    expect(t.has("RSTICK")).toBe(false);

    const rep = t.report();
    expect(rep.avgStickPrecision).toBeCloseTo(0.75, 5);
    expect(rep.independenceRatio).toBe(0);
    expect(rep.totalActiveFrames).toBe(2);
  });

  it("computes the independence ratio as both-sticks frames over either-stick frames", () => {
    const t = new SkillTracker();
    t.sampleSticks(0.5, 0); // move only
    t.sampleSticks(0.5, 0.5); // both
    t.sampleSticks(0.5, 0.5); // both
    const rep = t.report();
    expect(rep.independenceRatio).toBeCloseTo(2 / 3, 5);
    expect(rep.totalActiveFrames).toBe(3);
  });

  it("report() is a snapshot — later activity doesn't retroactively change it", () => {
    const t = new SkillTracker();
    t.markInput("LSTICK");
    const first = t.report();
    t.markInput("RSTICK");
    expect(first.discovered.has("RSTICK")).toBe(false);
    expect(t.report().discovered.has("RSTICK")).toBe(true);
  });
});
