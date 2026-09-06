import { describe, it, expect } from "vitest";
import { GhostHint, type GhostHintConfig } from "@/ui/GhostHint";

/**
 * GhostHint is the entire wordless-tutorial escalation: pulse, then a one-shot
 * ghost demo, then periodic replay, all driven off a single idle-seconds clock
 * the scene reports each frame. A broken threshold or replay cooldown here
 * doesn't crash or glitch on screen — it just quietly stops teaching, which is
 * exactly the class of bug this project can't afford to leave unverified.
 */
function makeHint(cfg: Partial<GhostHintConfig> & { isDone?: () => boolean } = {}) {
  const calls = { pulse: 0, stopPulse: 0, ghost: 0 };
  const hint = new GhostHint({
    onPulse: () => calls.pulse++,
    onStopPulse: () => calls.stopPulse++,
    onGhost: () => calls.ghost++,
    pulseAfter: 6,
    ghostAfter: 12,
    replayEvery: 8,
    ...cfg,
  });
  return { hint, calls };
}

describe("GhostHint", () => {
  it("stays silent before pulseAfter", () => {
    const { hint, calls } = makeHint();
    hint.tick(0);
    hint.tick(5.9);
    expect(calls).toEqual({ pulse: 0, stopPulse: 0, ghost: 0 });
  });

  it("pulses once idle crosses pulseAfter, and does not re-pulse every frame", () => {
    const { hint, calls } = makeHint();
    hint.tick(6);
    expect(calls.pulse).toBe(1);
    hint.tick(7);
    hint.tick(8);
    expect(calls.pulse).toBe(1); // ensurePulse guards repeat calls
  });

  it("fires the ghost demo immediately on first crossing ghostAfter", () => {
    const { hint, calls } = makeHint();
    hint.tick(12);
    expect(calls.ghost).toBe(1);
    expect(calls.pulse).toBe(1);
  });

  it("replays the ghost only after replayEvery seconds, not every frame", () => {
    const { hint, calls } = makeHint();
    hint.tick(12); // first ghost
    expect(calls.ghost).toBe(1);
    hint.tick(15); // 15 - 12 = 3s, under replayEvery(8) — no replay yet
    expect(calls.ghost).toBe(1);
    hint.tick(20); // 20 - 12 = 8s — replay
    expect(calls.ghost).toBe(2);
  });

  it("settles (stops pulsing) as soon as isDone reports true", () => {
    let done = false;
    const { hint, calls } = makeHint({ isDone: () => done });
    hint.tick(7);
    expect(calls.pulse).toBe(1);
    expect(calls.stopPulse).toBe(0);

    done = true;
    hint.tick(8);
    expect(calls.stopPulse).toBe(1);

    // Once done, further idle time never pulses or ghosts again.
    hint.tick(100);
    expect(calls.pulse).toBe(1);
    expect(calls.ghost).toBe(0);
  });

  it("never pulses or ghosts at all if isDone is already true from the start", () => {
    const { hint, calls } = makeHint({ isDone: () => true });
    hint.tick(100);
    expect(calls).toEqual({ pulse: 0, stopPulse: 0, ghost: 0 });
  });

  it("reset() settles an active pulse", () => {
    const { hint, calls } = makeHint();
    hint.tick(7);
    expect(calls.pulse).toBe(1);
    hint.reset();
    expect(calls.stopPulse).toBe(1);
  });

  it("reset() clears the replay cooldown so the next ghost fires immediately", () => {
    const { hint, calls } = makeHint();
    hint.tick(12);
    expect(calls.ghost).toBe(1);

    hint.reset();
    // Without reset() clearing lastGhostAt, this would be suppressed for
    // another `replayEvery` seconds of idle time.
    hint.tick(12);
    expect(calls.ghost).toBe(2);
  });
});
