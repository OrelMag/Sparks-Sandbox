# Spark's Sandbox

A colorful clockwork robot in an indestructible playground.

## The objective (read this first)

**This game exists to teach one specific 7-year-old boy to use an Xbox controller.**
The game is the *means*; controller literacy is the *end*. This ordering will try to
invert itself during development — that is the natural drift of any game project, and
resisting it is job #1.

**Every prop, level, and puzzle must justify itself by naming which physical input it
drills.** If a thing is charming but drills no input, cut it.

Two facts about the player govern everything:

1. **He does not read — in any language.** The game therefore contains **no words**.
   Teaching happens through animation, color, sound, cause-and-effect, and haptics.
2. **The constraint is literacy, not capability.** A 7-year-old can master dual-stick
   control and reason about an AND gate. He just can't read an instruction. So we remove
   every word and **soften no mechanic**.

## The Controller Curriculum

This table **is** the game design. Levels are downstream of it. Never introduce two new
inputs at once: introduce one alone, drill it to automaticity, then combine.

| # | Skill | Physical input | Real-game convention | Taught by |
|---|-------|----------------|----------------------|-----------|
| 0 | Discrete press → effect | A, B, X, Y | jump / cancel / use / alt | P1 spring, bell, fan, lights |
| 1 | Discrete direction | D-pad | menu & selection | P1 toy selector |
| 2 | One analog axis | Left stick (X only) | — (scaffold) | P2a gear catch |
| 3 | Two analog axes | Left stick (full) | **move** | P2b sheep pen |
| 4 | Analog + button chord | LS + L3 click | **sprint** | P2b dash |
| 5 | Two sticks, independent | LS + RS | **move + aim** | P3 drive & aim |
| 6 | Two sticks + trigger | LS + RS + RT | **move + aim + fire** | P3 water cannon |
| 7 | Hold-and-press chord | LT held + A | ADS / brace / modifier | P4 conveyor |
| 8 | Simultaneous symmetric | LB + RB together | two-handed modifiers | P4 AND bridge |

Skill 5 (independent sticks) is the single biggest wall in controller literacy. It is why
**there is no camera control anywhere in this game** — right-stick-is-camera is what makes
kids stare at the ceiling and quit. He learns right-stick-is-*aim* first, on a fixed
camera. Phase 4's real lesson is **chording, not logic**: the circuitry is the wrapper,
the finger pattern is the lesson.

## The transfer rule

Skills must transfer to *real* games, so every input uses its **universal console
convention**, never whatever is easiest for our fiction:

- Left stick = move · Right stick = aim/look · A = jump/confirm · B = cancel
- **RT = primary action (fire/use).** The water cannon fires on RT, not a face button.

If we invent a bespoke mapping, we teach a habit he must later unlearn. Don't.

## The three golden rules (hard constraints)

Enforced by `npm run guard` (see `scripts/guard.mjs`), which CI runs.

1. **Zero failure states.** No health, death, falling, timers, lose conditions. The
   identifiers `health`, `damage`, `die`, `respawn`, `lives`, `gameOver`, `timeLeft` do
   not exist in the codebase — there is no API to call. World edges *soft-clamp*. Missed
   gears pile up and stay collectible (missing is a slower success, not a loss). Puzzles
   never lock out. *Why:* the toy must never punish; punishment is what makes a
   non-reader quit.
2. **Color mapping is literal.** An on-screen 'A' prompt is Xbox green *because it is an
   'A' prompt*. `config/Palette.ts` holds the only button colors. `ButtonPrompt` derives
   glyph + color + sound from one map and **exposes no color parameter** — a red 'A' is
   unrepresentable, not just discouraged. *Why:* the color mapping IS the lesson of P1.
3. **Zero words.** No `Phaser.GameObjects.Text` in `src/` (the guard bans it). Every
   would-be label is a pictogram, an icon, or `ProgressPips`. *Why:* he can't read; a word
   is a dead end. Banning the `Text` class outright stops "just one tiny label" becoming
   twelve.

**Carve-out — the A/B/X/Y glyphs are allowed and are NOT a rule-3 violation.** He is not
*reading* an 'A'; he is *shape-matching* the on-screen symbol against the identical symbol
under his thumb. That match is the entire Phase 1 lesson. Do not "fix" this in either
direction: don't remove the glyphs, and don't add real words next to them.

**The only exception to rule 3** is `src/ui/DebugOverlay.ts` (Observation Mode): parent-
facing, hotkey-toggled, stripped from production. It is allowlisted in the guard.

## Architecture

**Semantic input layer — the spine.** No gameplay code ever reads `gamepad.buttons[0]`.
It asks `input.justPressed(Action.PRIMARY)`. Colors, pictograms, keyboard fallback,
rumble, and rebinding all hang off `Action`. If you find yourself typing a raw button
index outside `src/input/`, stop.

- **Controller-slot pattern.** `Spark` owns visuals + juice; movement is a swappable
  controller: `Stationary` (P1) · `Axis` (P2a) · `FreeRoam` (P2b) · `Tank` (P3) ·
  `Puzzle` (P4). Scenes swap the slot; everything else about Spark is shared. New phase =
  new controller, not a new robot.
- **Interactable pattern.** `systems/Interactable.ts` backs both P1 props and P4 switches.
- **P4 signal graph.** A data-defined DAG in `systems/logic/`: sources (plate/switch/
  lever) → gates (AND/OR/NOT/latch) → sinks (door/bridge/conveyor/lamp), plus wires.
  Every node answers `isPowered()`; evaluated by a topological walk each frame. The AND
  bridge is `AndGate([SwitchLB, SwitchRB]) → Bridge` — simultaneity is inherent, no timing
  code. Puzzles live in `levels/phase4/*.ts` as **data**: a new puzzle needs zero engine
  code.
- **Radial deadzone, never per-axis** (`input/InputState.ts`). Per-axis creates a "sticky
  cross" — diagonals go dead and the robot feels like it's fighting him. This five-line
  function decides whether Phase 2 works.

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Vite dev server + hot reload. Plug in a pad and play. |
| `npm run build` | Typecheck + production build. |
| `npm test` | Vitest (deadzone math, logic graph, save state). |
| `npm run guard` | Golden-rule grep. Fails on forbidden identifiers / `Text`. |
| `npm run check` | typecheck + guard + test. Run before committing. |
| `npm run smoke <scene>` | Headless-Chromium runtime check: loads a scene, fails on any console/page error, drives it via keyboard, writes screenshots. Needs `npm run dev` running. |

Dev scene-jump: `?scene=phase3` in the URL (also `hub`, `phase1`, `phase2`, `phase4`,
`debug`). Standard-mapping reference: buttons `0=A 1=B 2=X 3=Y 4=LB 5=RB 6=LT 7=RT
10=L3 11=R3`; axes `0,1=LS 2,3=RS`.

**Observation Mode** (parent-facing): press the backtick key (`` ` ``) in any scene to
toggle the dev overlay showing discovered inputs, stick precision, and the Phase-3
independence ratio. Stripped from production; the child never sees it.

**Verifying a graphics change:** typecheck can't see a mispositioned sprite or a
NaN'd velocity. Run the app (`npm run dev` + a pad, or `npm run smoke <scene>`) and
LOOK. Two real bugs in this codebase were invisible to the compiler: a radial-deadzone
divide-by-zero that NaN'd Spark's position, and a container physics body offset that
made pushing miss. Both showed up only on screen.

## How to add things

- **A prop:** implement `Interactable`, bind it to an `Action`, drop it in a scene. The
  prompt color/glyph/sound come from `Action` automatically — do not pass a color.
- **A P4 puzzle:** add a data file to `levels/phase4/`. Wire sources → gates → sinks. No
  engine changes.
- **A phase:** add a controller in `entities/controllers/`, a scene in `scenes/`, and a
  curriculum row in `config/Curriculum.ts`. **First answer: which input does it drill?**

## Playtesting

`config/Tuning.ts` is the file you touch after watching him play — deadzones, speeds,
assist strength, hint timings. **Every place he stalls is a place the *hints* failed, not
a place he failed.** Fix `Tuning.ts` and the ghost demos; never add a word. Then check
Observation Mode: if the Phase 3 stick-independence ratio is climbing, it's working.
