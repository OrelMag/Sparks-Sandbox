import { describe, it, expect } from "vitest";
import {
  Source,
  AndGate,
  OrGate,
  NotGate,
  Latch,
  SignalGraph,
} from "@/systems/logic/SignalGraph";

/**
 * The Phase 4 truth tables. A wrong one is invisible until a bridge silently
 * won't extend, so we pin them here. The AND gate is the important one: the
 * dual-bumper bridge lives or dies on "both, in the same evaluation".
 */

describe("AndGate — the dual-bumper bridge", () => {
  it("powers only when ALL inputs are powered in the same evaluation", () => {
    const lb = new Source(false);
    const rb = new Source(false);
    const bridge = new AndGate([lb, rb]);

    expect(bridge.isPowered()).toBe(false); // neither
    lb.set(true);
    expect(bridge.isPowered()).toBe(false); // only LB — must NOT open
    rb.set(true);
    expect(bridge.isPowered()).toBe(true); // both, simultaneously
    lb.set(false);
    expect(bridge.isPowered()).toBe(false); // released → closes again
  });

  it("is false with no inputs (a bridge with nothing wired stays shut)", () => {
    expect(new AndGate([]).isPowered()).toBe(false);
  });
});

describe("OrGate / NotGate", () => {
  it("OR powers when any input is powered", () => {
    const a = new Source(false);
    const b = new Source(false);
    const or = new OrGate([a, b]);
    expect(or.isPowered()).toBe(false);
    b.set(true);
    expect(or.isPowered()).toBe(true);
  });

  it("NOT inverts its input", () => {
    const a = new Source(true);
    const not = new NotGate(a);
    expect(not.isPowered()).toBe(false);
    a.set(false);
    expect(not.isPowered()).toBe(true);
  });
});

describe("Latch — the conveyor toggle", () => {
  it("flips state on each rising edge, ignoring held input", () => {
    const button = new Source(false);
    const latch = new Latch(button);
    const graph = new SignalGraph();
    graph.track(latch);

    const press = () => {
      button.set(true);
      graph.step();
    };
    const release = () => {
      button.set(false);
      graph.step();
    };

    expect(latch.isPowered()).toBe(false);
    press(); // first press → on
    expect(latch.isPowered()).toBe(true);
    graph.step(); // still held — must not re-toggle
    expect(latch.isPowered()).toBe(true);
    release();
    expect(latch.isPowered()).toBe(true); // release doesn't toggle
    press(); // second press → off
    expect(latch.isPowered()).toBe(false);
  });
});
