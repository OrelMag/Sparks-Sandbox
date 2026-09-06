/**
 * Phase3Levels.ts — the three-arena skill-5/6 progression, as data.
 *
 * Deliberately free of Phaser, like Curriculum.ts and SignalGraph.ts: it lives
 * here (not inline in Phase3_DualStick.ts) so the level-chain itself — key
 * uniqueness, the nextScene handoff, moving-target data shape — is unit-testable
 * in tests/phase3-levels.test.ts without booting a browser environment.
 */

export type Target = readonly [x: number, y: number, toX?: number, toY?: number, duration?: number];

export interface DualStickLevel {
  key: string;
  targets: readonly Target[];
  nextScene: string;
  nextIcon: "dualstick" | "gears";
}

export const LEVELS: readonly DualStickLevel[] = [
  {
    key: "P3_DualStick",
    targets: [
      [220, 180],
      [1050, 180],
      [180, 560],
      [1080, 560],
      [640, 150],
    ],
    nextScene: "P3_MovingTargets",
    nextIcon: "dualstick",
  },
  {
    key: "P3_MovingTargets",
    targets: [
      [220, 170, 1060, 170, 4200],
      [1060, 360, 220, 360, 4800],
      [220, 550, 1060, 550, 4200],
    ],
    nextScene: "P3_CrossingStreams",
    nextIcon: "dualstick",
  },
  {
    key: "P3_CrossingStreams",
    targets: [
      [220, 220, 1060, 220, 4200],
      [1060, 500, 220, 500, 4200],
      [380, 130, 380, 590, 3600],
      [900, 590, 900, 130, 3600],
    ],
    nextScene: "P4_AutomationGates",
    nextIcon: "gears",
  },
];
