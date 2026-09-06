/**
 * InteractableManager.ts — a collection that updates every prop in a phase and
 * tracks how many have been discovered.
 *
 * Thin on purpose: it keeps "update all props" bookkeeping out of each scene.
 * Hint registration is a separate concern, handled by PhaseScene.addInteractable
 * (which registers `item.hint` with the idle clock directly) — a phase just does
 * `this.addInteractable(new Spring(...))` and the base loop handles the rest.
 */

import type { ManagedProp, InteractContext } from "./Interactable";

export class InteractableManager {
  private items: ManagedProp[] = [];

  add<T extends ManagedProp>(item: T): T {
    this.items.push(item);
    return item;
  }

  update(ctx: InteractContext): void {
    for (const it of this.items) it.update(ctx);
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
