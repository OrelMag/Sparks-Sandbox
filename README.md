# Spark's Sandbox

A colorful clockwork robot in an indestructible playground — a game whose real job
is to teach a young child to use an Xbox controller, with **no words on screen** and
**no way to fail**.

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (e.g. `http://localhost:5173`) and **plug in an Xbox
controller**. Press any button to wake it up. A keyboard also works for testing
(WASD move, arrows aim, Space = A, Enter = fire, Shift = LT, Q/E = bumpers).

To share a build: `npm run build` produces a static `dist/` you can host anywhere.

## What it teaches, in order

The game is a ladder of controller skills. Each phase introduces **one** new input,
lets the child master it, then combines it with what he already knows. He picks
phases by driving Spark into a door in the hub — there is no menu to read.

| Phase | The door shows | New skill | Real-game habit |
|-------|----------------|-----------|-----------------|
| 1 · Busy-Box | four colored buttons | press A / B / X / Y, use the d-pad | jump, cancel, menus |
| 2 · Gear Pen | a gear | tilt the left stick — first side-to-side, then all around, then click to dash | move, sprint |
| 3 · Fire Truck | two sticks | drive with the left stick **and** aim with the right, then pull RT to spray | move + aim + fire |
| 4 · Automation | meshed gears | button chords: hold LT + press A, and hold both bumpers at once | modifiers, two-handed inputs |

On-screen prompts always match the controller: a green **A** on screen is the green
A under his thumb. Anything without a letter (bumpers, triggers, sticks) is shown as
a little picture of the controller with that part lit up. Nothing is ever spelled out.

**There is no losing.** Spark can't fall, run out of anything, or be hurt. Missing
just means trying again. The world quietly grows when he shows a new skill.

## For the grown-up

Press the backtick key (`` ` ``) to open **Observation Mode** — a private overlay
(the child never sees it) showing which inputs he's discovered and how his two-stick
coordination is coming along. It's how you tell the toy is working, and which phase
to leave him in.

Difficulty is two pedestals in the hub: one gear (**simple** — everything is a toy)
or three gears (**logic** — Phase 4 exposes the AND/OR circuitry for an older child).
He chooses by standing on one. The constraint here is reading, not ability: a 7-year-
old can absolutely learn dual-stick control and reason about an AND gate.

## For developers

See [CLAUDE.md](CLAUDE.md) for architecture, the three golden rules (enforced by
`npm run guard`), and how to add a prop, puzzle, or phase. `npm run check` runs
typecheck + guard + tests; `npm run smoke <scene>` does a headless runtime check.
