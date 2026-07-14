/**
 * PressProp.ts — an Interactable triggered by a single button press.
 *
 * The Phase 1 toys (spring, bell, fan, lights) are all "press the button, the
 * thing happens". This base wires that: it reports triggered while the bound
 * button is down, and Interactable's rising-edge logic turns that into a single
 * activation per press. Subclasses only build their look and implement respond().
 */

import { Interactable, InteractContext } from "@/systems/Interactable";

export abstract class PressProp extends Interactable {
  protected isTriggered(ctx: InteractContext): boolean {
    return ctx.services.input.isDown(this.action);
  }
}
