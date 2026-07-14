/**
 * SignalGraph.ts — the Phase 4 logic, as pure data.
 *
 * A tiny DAG: Sources feed Gates feed Sinks, joined by Wires. Every node answers
 * isPowered(); sinks are evaluated each frame and recursion pulls the answer back
 * through the gates. The graphs are tiny, so we don't bother memoizing.
 *
 * This file is deliberately free of Phaser and rendering — it is unit-tested
 * (see tests/logic.test.ts), because a wrong truth table is invisible on screen
 * until a bridge won't extend. The AND gate is the load-bearing one: the
 * dual-bumper bridge is AndGate([lb, rb]), and its simultaneity is INHERENT —
 * both inputs must report powered in the same evaluation, so there is no timing
 * code to get wrong.
 */

export interface SignalNode {
  isPowered(): boolean;
  /** Optional per-frame step (only stateful nodes like Latch need it). */
  step?(): void;
}

/** A source whose power is set by the world (a plate pressed, a bumper held). */
export class Source implements SignalNode {
  private powered = false;
  constructor(powered = false) {
    this.powered = powered;
  }
  isPowered(): boolean {
    return this.powered;
  }
  set(v: boolean): void {
    this.powered = v;
  }
}

export class AndGate implements SignalNode {
  constructor(private inputs: SignalNode[]) {}
  isPowered(): boolean {
    return this.inputs.length > 0 && this.inputs.every((i) => i.isPowered());
  }
}

export class OrGate implements SignalNode {
  constructor(private inputs: SignalNode[]) {}
  isPowered(): boolean {
    return this.inputs.some((i) => i.isPowered());
  }
}

export class NotGate implements SignalNode {
  constructor(private input: SignalNode) {}
  isPowered(): boolean {
    return !this.input.isPowered();
  }
}

/**
 * A toggle flip-flop: each RISING edge of its input flips its stored state. This
 * is the conveyor's brain — press A (its input) and the belt flips on/off. Needs
 * step() each frame to see edges.
 */
export class Latch implements SignalNode {
  private state: boolean;
  private prevInput = false;
  constructor(
    private input: SignalNode,
    initial = false
  ) {
    this.state = initial;
  }
  step(): void {
    const now = this.input.isPowered();
    if (now && !this.prevInput) this.state = !this.state;
    this.prevInput = now;
  }
  isPowered(): boolean {
    return this.state;
  }
  get value(): boolean {
    return this.state;
  }
}

/**
 * A small registry of the stateful nodes in a puzzle, so the scene can step them
 * once per frame in insertion order without hunting them down.
 */
export class SignalGraph {
  private stateful: SignalNode[] = [];

  track<T extends SignalNode>(node: T): T {
    if (node.step) this.stateful.push(node);
    return node;
  }

  step(): void {
    for (const n of this.stateful) n.step?.();
  }
}
