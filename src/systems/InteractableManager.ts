/**
 * InteractableManager.ts — a collection that updates interactables and exposes
 * their hints for the scene's idle-escalation loop.
 *
 * Thin on purpose: it keeps the "update all props" and "register all hints"
 * bookkeeping out of each scene, so a phase just does `this.props.add(new
 * Spring(...))` and the base loop handles the rest.
 */

import type { ManagedProp, InteractContext } from "./Interactable";
import type { GhostHint } from "@/ui/GhostHint";

export class InteractableManager {
  private items: ManagedProp[] = [];

  add<T extends ManagedProp>(item: T): T {
    this.items.push(item);
    return item;
  }

  update(ctx: InteractContext): void {
    for (const it of this.items) it.update(ctx);
  }

  /** All hints, for the scene to register with its idle clock. */
  hints(): GhostHint[] {
    return this.items.map((i) => i.hint);
  }

  /** True once every prop has been discovered — a wordless "phase explored". */
  get allDiscovered(): boolean {
    return this.items.length > 0 && this.items.every((i) => i.discovered);
  }

  get discoveredCount(): number {
    return this.items.filter((i) => i.discovered).length;
  }

  get count(): number {
    return this.items.length;
  }

  destroy(): void {
    for (const it of this.items) it.destroy();
    this.items = [];
  }
}
