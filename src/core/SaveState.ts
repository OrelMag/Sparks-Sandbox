/**
 * SaveState.ts — persistent progress via localStorage.
 *
 * Stores which phases have been opened and the chosen difficulty tier. There is
 * deliberately no score, no completion percentage, no stars — remembering only
 * what has been *opened*, never how "well" he did. Round-tripped in tests.
 */

import { SkillTier } from "./SkillTier";

const KEY = "spark-sandbox.save.v1";

export interface SaveData {
  /** Phase scene keys that have been unlocked/opened. */
  openedPhases: string[];
  tier: SkillTier;
}

/**
 * A FRESH default each call. Must be a factory, not a shared constant: a shared
 * object's `openedPhases` array would be aliased into every instance by a
 * shallow spread, so mutating one save would mutate them all.
 */
function makeDefault(): SaveData {
  return { openedPhases: [], tier: SkillTier.SIMPLE };
}

export class SaveState {
  private data: SaveData;

  constructor(private storage: Storage | null = safeStorage()) {
    this.data = this.load();
  }

  private load(): SaveData {
    if (!this.storage) return makeDefault();
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return makeDefault();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        openedPhases: parsed.openedPhases ?? [],
        tier: parsed.tier === SkillTier.LOGIC ? SkillTier.LOGIC : SkillTier.SIMPLE,
      };
    } catch {
      return makeDefault();
    }
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage full or blocked — progress simply isn't saved, never a crash */
    }
  }

  openPhase(sceneKey: string): void {
    if (!this.data.openedPhases.includes(sceneKey)) {
      this.data.openedPhases.push(sceneKey);
      this.persist();
    }
  }

  isOpened(sceneKey: string): boolean {
    return this.data.openedPhases.includes(sceneKey);
  }

  get tier(): SkillTier {
    return this.data.tier;
  }

  setTier(tier: SkillTier): void {
    this.data.tier = tier;
    this.persist();
  }

  snapshot(): SaveData {
    return { openedPhases: [...this.data.openedPhases], tier: this.data.tier };
  }
}

/** localStorage may throw in private mode / sandboxed iframes; degrade to null. */
function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const t = "__spark_probe__";
    localStorage.setItem(t, "1");
    localStorage.removeItem(t);
    return localStorage;
  } catch {
    return null;
  }
}
