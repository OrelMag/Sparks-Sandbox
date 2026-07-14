/**
 * Curriculum.ts — the Controller Curriculum as data.
 *
 * This encodes the table in CLAUDE.md: each skill, the input it drills, the
 * scene that teaches it, and the console convention it transfers to. Scenes and
 * Observation Mode read this so the pedagogy has one authoritative source, not a
 * copy scattered across level code.
 *
 * The golden ordering rule ("never two new inputs at once") is visible here: the
 * `introduces` list of each step has exactly the new input(s) that step adds.
 */

export interface CurriculumStep {
  id: number;
  /** Human-facing (dev-only) name of the skill. */
  skill: string;
  /** Diagram parts / stick ids newly introduced at this step. */
  introduces: string[];
  /** Scene key that drills it. */
  scene: string;
  /** The real-game convention it builds toward. */
  transfersTo: string;
}

export const CURRICULUM: CurriculumStep[] = [
  { id: 0, skill: "Discrete press", introduces: ["A", "B", "X", "Y"], scene: "P1_BusyBox", transfersTo: "jump/cancel/use/alt" },
  { id: 1, skill: "Discrete direction", introduces: ["DPAD"], scene: "P1_BusyBox", transfersTo: "menus" },
  { id: 2, skill: "One analog axis", introduces: ["LSTICK_X"], scene: "P2a_GearCatch", transfersTo: "(scaffold)" },
  { id: 3, skill: "Two analog axes", introduces: ["LSTICK"], scene: "P2b_SheepPen", transfersTo: "move" },
  { id: 4, skill: "Analog + button chord", introduces: ["L3"], scene: "P2b_SheepPen", transfersTo: "sprint" },
  { id: 5, skill: "Two sticks independent", introduces: ["RSTICK"], scene: "P3_DualStick", transfersTo: "move+aim" },
  { id: 6, skill: "Two sticks + trigger", introduces: ["RT"], scene: "P3_DualStick", transfersTo: "move+aim+fire" },
  { id: 7, skill: "Hold-and-press chord", introduces: ["LT"], scene: "P4_AutomationGates", transfersTo: "ADS/brace" },
  { id: 8, skill: "Simultaneous symmetric", introduces: ["LB", "RB"], scene: "P4_AutomationGates", transfersTo: "two-handed" },
];
