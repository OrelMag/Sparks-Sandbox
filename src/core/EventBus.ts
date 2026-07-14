/**
 * EventBus.ts — a tiny typed pub/sub for cross-cutting signals.
 *
 * Kept minimal on purpose. Scenes use Phaser's own events for local wiring;
 * this bus is for game-wide things (a skill unlocked, a phase completed) that
 * shouldn't couple scenes together.
 */

export type Handler<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    (this.handlers[event] ??= new Set()).add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers[event]?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers[event]?.forEach((h) => h(payload));
  }
}

/** Game-wide events. */
export interface GameEvents {
  phaseComplete: { phase: string };
  skillUnlocked: { skill: string };
  [key: string]: unknown;
}

export const gameBus = new EventBus<GameEvents>();
